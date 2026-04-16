const express = require('express');
const MedicalRecord = require('../models/MedicalRecord');
const BlockChain = require('../models/BlockChain');
const Patient = require('../models/Patient');
const { createBlockForRecord, verifyRecordIntegrity } = require('../blockchain/chain');
const { logActivity } = require('../utils/logActivity');
const { authGuard } = require('../middleware/authGuard');
const { roleGuard } = require('../middleware/roleGuard');
const { doctorHasAccess } = require('../helpers/access');
const { emitInApp } = require('../services/notificationService');

const router = express.Router();

function clientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
}

async function attachVerification(record) {
  const lean = record.toObject ? record.toObject() : record;
  if (!lean.blockchainId) {
    return { ...lean, blockchainVerified: false, tampered: true };
  }
  const block = await BlockChain.findById(lean.blockchainId).lean();
  const v = await verifyRecordIntegrity(lean, block);
  return {
    ...lean,
    blockchainVerified: v.verified,
    tampered: !v.verified,
    blockInfo: block
      ? {
          hash: block.hash,
          previousHash: block.previousHash,
          blockIndex: block.blockIndex,
          timestamp: block.timestamp,
          txHash: block.txHash,
          chainId: block.chainId,
        }
      : null,
  };
}

router.post(
  '/',
  authGuard,
  roleGuard(['doctor']),
  async (req, res) => {
    try {
      const {
        patientId,
        diagnosis,
        symptoms,
        prescription,
        notes,
        date,
      } = req.body;
      if (!patientId) {
        return res.status(400).json({ message: 'patientId required' });
      }
      const patient = await Patient.findById(patientId);
      if (!patient) return res.status(404).json({ message: 'Patient not found' });

      const has = await doctorHasAccess(patient._id, req.user.userId);
      if (!has) {
        return res.status(403).json({ message: 'Patient has not granted access' });
      }

      const record = await MedicalRecord.create({
        patientId,
        doctorId: req.user.userId,
        diagnosis,
        symptoms: symptoms || [],
        prescription: prescription || [],
        notes,
        date: date ? new Date(date) : new Date(),
      });

      let block;
      try {
        block = await createBlockForRecord(record);
      } catch (e) {
        if (e.code === 'ETHEREUM_ANCHOR_FAILED') {
          await MedicalRecord.findByIdAndDelete(record._id);
          console.error(e);
          return res.status(502).json({
            message:
              'Could not anchor this record on Ethereum. Check RPC URL, wallet key, network ETH balance, and server logs.',
          });
        }
        throw e;
      }
      record.blockchainId = block._id;
      await record.save();

      await logActivity({
        userId: req.user.userId,
        role: req.user.role,
        action: 'create',
        patientId: patient._id,
        sessionId: req.user.sessionId,
        ipAddress: clientIp(req),
        meta: { recordId: record._id.toString() },
      });

      if (patient.userId) {
        await emitInApp({
          userId: patient.userId,
          type: 'medical_record',
          title: 'New medical record',
          body: `A new visit record was added to your chart for ${patient.name}.`,
          routeLink: '/dashboard/patient/history',
        });
      }

      const withV = await attachVerification(record);
      res.status(201).json(withV);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get('/:patientId', authGuard, async (req, res) => {
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
      if (!has) {
        return res.status(403).json({ message: 'Access not granted' });
      }
    } else {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const records = await MedicalRecord.find({
      patientId: patient._id,
      isArchived: false,
    })
      .sort({ date: -1 })
      .populate('doctorId', 'name specialty regNo')
      .lean();

    const out = [];
    for (const r of records) {
      out.push(await attachVerification(r));
    }

    await logActivity({
      userId: req.user.userId,
      role: req.user.role,
      action: 'view',
      patientId: patient._id,
      sessionId: req.user.sessionId,
      ipAddress: clientIp(req),
      meta: { context: 'records_list' },
    });

    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/archive', authGuard, roleGuard(['doctor']), async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Not found' });
    const patient = await Patient.findById(record.patientId);
    const has = await doctorHasAccess(patient._id, req.user.userId);
    if (!has) return res.status(403).json({ message: 'Access not granted' });
    record.isArchived = true;
    record.version = (record.version || 1) + 1;
    await record.save();
    await logActivity({
      userId: req.user.userId,
      role: req.user.role,
      action: 'update',
      patientId: patient._id,
      sessionId: req.user.sessionId,
      ipAddress: clientIp(req),
      meta: { recordId: record._id.toString(), archived: true },
    });
    res.json(record);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
