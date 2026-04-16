const express = require('express');
const MedicalRecord = require('../models/MedicalRecord');
const MedicineReminder = require('../models/MedicineReminder');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { logActivity } = require('../utils/logActivity');
const { authGuard } = require('../middleware/authGuard');
const { roleGuard } = require('../middleware/roleGuard');
const { doctorHasAccess } = require('../helpers/access');
const { buildPrescriptionPdfBuffer } = require('../utils/pdfGenerator');
const { createBlockForRecord, verifyRecordIntegrity } = require('../blockchain/chain');
const BlockChain = require('../models/BlockChain');
const { sha256, buildMedicalRecordHashPayload } = require('../utils/hashGenerator');
const { emitInApp } = require('../services/notificationService');

const router = express.Router();

function clientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
}

function parseTimesFromFrequency(freq) {
  const f = (freq || '').toLowerCase();
  const times = [];
  if (f.includes('morning') || f.includes('bd') || f.includes('twice')) {
    times.push('08:00');
  }
  if (f.includes('night') || f.includes('bedtime')) {
    times.push('20:00');
  }
  if (f.includes('afternoon')) times.push('14:00');
  if (times.length === 0) times.push('08:00');
  return times;
}

router.post(
  '/',
  authGuard,
  roleGuard(['doctor']),
  async (req, res) => {
    try {
      const {
        patientId,
        recordId,
        medicines,
        notes,
        nextVisit,
        diagnosis,
      } = req.body;
      if (!patientId || !medicines?.length) {
        return res.status(400).json({ message: 'patientId and medicines required' });
      }
      const patient = await Patient.findById(patientId).populate('userId');
      if (!patient) return res.status(404).json({ message: 'Patient not found' });
      const has = await doctorHasAccess(patient._id, req.user.userId);
      if (!has) return res.status(403).json({ message: 'Access not granted' });

      const doctor = await User.findById(req.user.userId);
      const prescription = medicines.map((m) => ({
        medicine: m.name || m.medicine,
        dosage: m.dosage || '',
        frequency: m.frequency || '',
        duration: m.duration || '',
      }));

      let record;
      if (recordId) {
        record = await MedicalRecord.findById(recordId);
        if (!record) return res.status(404).json({ message: 'Record not found' });
        record.prescription = prescription;
        if (notes) record.notes = notes;
        if (diagnosis) record.diagnosis = diagnosis;
        record.version = (record.version || 1) + 1;
        await record.save();
        if (!record.blockchainId) {
          try {
            const block = await createBlockForRecord(record);
            record.blockchainId = block._id;
            await record.save();
          } catch (e) {
            if (e.code === 'ETHEREUM_ANCHOR_FAILED') {
              console.error(e);
              return res.status(502).json({
                message:
                  'Could not anchor on Ethereum. Check RPC, wallet key, and ETH balance. Record was saved without a new chain block.',
              });
            }
            throw e;
          }
        } else {
          const newHash = sha256(buildMedicalRecordHashPayload(record));
          await BlockChain.findByIdAndUpdate(record.blockchainId, { hash: newHash });
        }
      } else {
        record = await MedicalRecord.create({
          patientId,
          doctorId: req.user.userId,
          diagnosis: diagnosis || 'Prescription',
          symptoms: [],
          prescription,
          notes,
          date: new Date(),
        });
        try {
          const block = await createBlockForRecord(record);
          record.blockchainId = block._id;
          await record.save();
        } catch (e) {
          if (e.code === 'ETHEREUM_ANCHOR_FAILED') {
            await MedicalRecord.findByIdAndDelete(record._id);
            console.error(e);
            return res.status(502).json({
              message:
                'Could not anchor on Ethereum. Check RPC, wallet key, and ETH balance.',
            });
          }
          throw e;
        }
      }

      const medLines = medicines.map((m) => ({
        name: m.name || m.medicine,
        dosage: m.dosage || '',
        times: m.times?.length ? m.times : parseTimesFromFrequency(m.frequency),
        startDate: new Date(),
        endDate: m.endDate ? new Date(m.endDate) : undefined,
        takenLog: [],
      }));

      let mr = await MedicineReminder.findOne({
        patientId: patient._id,
        recordId: record._id,
      });
      if (!mr) {
        mr = await MedicineReminder.create({
          patientId: patient._id,
          recordId: record._id,
          medicines: medLines,
        });
      } else {
        mr.medicines = medLines;
        await mr.save();
      }

      await logActivity({
        userId: req.user.userId,
        role: req.user.role,
        action: 'create',
        patientId: patient._id,
        sessionId: req.user.sessionId,
        ipAddress: clientIp(req),
        meta: { type: 'prescription', recordId: record._id.toString() },
      });

      const patientNotifyId = patient.userId?._id ?? patient.userId;
      if (patientNotifyId) {
        await emitInApp({
          userId: patientNotifyId,
          type: 'prescription',
          title: 'New prescription',
          body: `Dr. ${doctor.name} added a prescription for ${patient.name}.`,
          routeLink: '/dashboard/patient/history',
        });
      }

      const pdf = await buildPrescriptionPdfBuffer({
        doctorName: doctor.name,
        specialty: doctor.specialty,
        regNo: doctor.regNo,
        dateStr: new Date().toLocaleString(),
        patientName: patient.name,
        patientId: patient.patientId,
        age: patient.age,
        bloodGroup: patient.bloodGroup,
        medicines: prescription,
        notes,
        nextVisit,
      });

      const withV = await verifyRecordIntegrity(
        record.toObject(),
        await BlockChain.findById(record.blockchainId).lean()
      );

      res.status(201).json({
        record,
        recordId: record._id,
        blockchainVerified: withV.verified,
        pdfBase64: pdf.toString('base64'),
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get(
  '/:patientId/pdf',
  authGuard,
  roleGuard(['doctor', 'patient']),
  async (req, res) => {
    try {
      const patient = await Patient.findById(req.params.patientId);
      if (!patient) return res.status(404).json({ message: 'Patient not found' });

      if (req.user.role === 'patient') {
        const own = await Patient.findOne({ userId: req.user.userId });
        if (!own || String(own._id) !== String(patient._id)) {
          return res.status(403).json({ message: 'Forbidden' });
        }
      } else if (req.user.role === 'doctor') {
        const has = await doctorHasAccess(patient._id, req.user.userId);
        if (!has) return res.status(403).json({ message: 'Access not granted' });
      }

      const record = await MedicalRecord.findOne({
        patientId: patient._id,
        isArchived: false,
        prescription: { $exists: true, $ne: [] },
      })
        .sort({ date: -1 })
        .populate('doctorId');

      if (!record) return res.status(404).json({ message: 'No prescription found' });

      const doctor = record.doctorId;
      const pdf = await buildPrescriptionPdfBuffer({
        doctorName: doctor.name,
        specialty: doctor.specialty,
        regNo: doctor.regNo,
        dateStr: new Date(record.date).toLocaleString(),
        patientName: patient.name,
        patientId: patient.patientId,
        age: patient.age,
        bloodGroup: patient.bloodGroup,
        medicines: record.prescription,
        notes: record.notes,
        nextVisit: '',
      });

      await logActivity({
        userId: req.user.userId,
        role: req.user.role,
        action: 'download',
        patientId: patient._id,
        sessionId: req.user.sessionId,
        ipAddress: clientIp(req),
        meta: { type: 'prescription_pdf' },
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="prescription-${patient.patientId}.pdf"`);
      res.send(pdf);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
