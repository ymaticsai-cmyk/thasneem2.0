const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Vital = require('../models/Vital');
const { generatePatientId } = require('../utils/patientId');
const { generatePatientQrDataUrl } = require('../utils/qrGenerator');
const { logActivity } = require('../utils/logActivity');
const { authGuard } = require('../middleware/authGuard');
const { roleGuard } = require('../middleware/roleGuard');
const { doctorHasAccess } = require('../helpers/access');
const { SALT } = require('./auth');

const router = express.Router();

function clientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
}

router.post(
  '/',
  authGuard,
  roleGuard(['receptionist']),
  async (req, res) => {
    try {
      const {
        name,
        age,
        gender,
        bloodGroup,
        allergies,
        chronicDiseases,
        emergencyContact,
        patientEmail,
        patientPassword,
        patientPhone,
      } = req.body;

      if (!name || age == null || !gender || !bloodGroup || !emergencyContact?.name) {
        return res.status(400).json({ message: 'Missing required patient fields' });
      }
      const email = (patientEmail || `patient_${Date.now()}@hospital.local`).toLowerCase();
      const password = patientPassword || `Temp${Math.random().toString(36).slice(2, 10)}!`;
      const hashed = await bcrypt.hash(password, SALT);

      const user = await User.create({
        name,
        email,
        password: hashed,
        role: 'patient',
        phone: patientPhone,
      });

      const patientId = await generatePatientId();
      const qrPayload = {
        patientId,
        name,
        bloodGroup,
        emergency: true,
      };
      const qrCodeUrl = await generatePatientQrDataUrl(qrPayload);

      const patient = await Patient.create({
        userId: user._id,
        patientId,
        name,
        age: Number(age),
        gender,
        bloodGroup,
        allergies: allergies || [],
        chronicDiseases: chronicDiseases || [],
        emergencyContact,
        qrCodeUrl,
        createdBy: req.user.userId,
      });

      await logActivity({
        userId: req.user.userId,
        role: req.user.role,
        action: 'create',
        patientId: patient._id,
        sessionId: req.user.sessionId,
        ipAddress: clientIp(req),
        meta: { type: 'patient_register' },
      });

      res.status(201).json({
        patient,
        patientLogin: { email, password },
      });
    } catch (e) {
      console.error(e);
      if (e.code === 11000) {
        return res.status(400).json({ message: 'Duplicate email or patient id' });
      }
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get('/me', authGuard, roleGuard(['patient']), async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.userId });
    if (!patient) return res.status(404).json({ message: 'Patient profile not found' });
    res.json(patient);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', authGuard, roleGuard(['doctor', 'receptionist', 'nurse']), async (req, res) => {
  try {
    const { q } = req.query;
    const filter = {};
    if (q) {
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { patientId: new RegExp(q, 'i') },
        { bloodGroup: new RegExp(q, 'i') },
      ];
    }
    const list = await Patient.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/by-patient-id/:patientId', authGuard, async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.patientId })
      .populate('userId', 'name email phone')
      .lean();
    if (!patient) return res.status(404).json({ message: 'Not found' });

    if (req.user.role === 'doctor') {
      const has = await doctorHasAccess(patient._id, req.user.userId);
      if (!has) {
        return res.status(403).json({
          message: 'Access not granted by patient',
          _id: patient._id,
          patientId: patient.patientId,
          name: patient.name,
          bloodGroup: patient.bloodGroup,
          needsAccess: true,
        });
      }
    }

    if (['doctor', 'nurse', 'receptionist'].includes(req.user.role)) {
      await logActivity({
        userId: req.user.userId,
        role: req.user.role,
        action: req.user.role === 'nurse' ? 'scan' : 'view',
        patientId: patient._id,
        sessionId: req.user.sessionId,
        ipAddress: clientIp(req),
      });
    }

    const lastVital =
      req.user.role === 'nurse'
        ? await Vital.findOne({ patientId: patient._id }).sort({ recordedAt: -1 }).lean()
        : undefined;

    res.json(lastVital ? { ...patient, lastVital } : patient);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch(
  '/:id',
  authGuard,
  roleGuard(['receptionist']),
  async (req, res) => {
    try {
      const patient = await Patient.findById(req.params.id);
      if (!patient) return res.status(404).json({ message: 'Not found' });

      const {
        name,
        age,
        gender,
        bloodGroup,
        allergies,
        chronicDiseases,
        emergencyContact,
        patientEmail,
        patientPhone,
      } = req.body;

      const previousName = patient.name;
      const previousBloodGroup = patient.bloodGroup;

      if (name != null && String(name).trim()) patient.name = String(name).trim();
      if (age != null && !Number.isNaN(Number(age))) patient.age = Number(age);
      if (gender != null) patient.gender = gender;
      if (bloodGroup != null) patient.bloodGroup = String(bloodGroup).trim();
      if (allergies != null) {
        patient.allergies = Array.isArray(allergies)
          ? allergies.map((s) => String(s).trim()).filter(Boolean)
          : String(allergies)
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
      }
      if (chronicDiseases != null) {
        patient.chronicDiseases = Array.isArray(chronicDiseases)
          ? chronicDiseases.map((s) => String(s).trim()).filter(Boolean)
          : String(chronicDiseases)
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
      }
      if (emergencyContact != null) {
        const ec = emergencyContact;
        if (!ec.name || !ec.phone) {
          return res.status(400).json({ message: 'Emergency contact name and phone required' });
        }
        patient.emergencyContact = {
          name: ec.name,
          phone: ec.phone,
          relation: ec.relation || patient.emergencyContact?.relation || '—',
        };
      }

      if (!patient.name || patient.age == null || !patient.gender || !patient.bloodGroup) {
        return res.status(400).json({ message: 'Name, age, gender, and blood group are required' });
      }

      if (patient.name !== previousName || patient.bloodGroup !== previousBloodGroup) {
        const qrPayload = {
          patientId: patient.patientId,
          name: patient.name,
          bloodGroup: patient.bloodGroup,
          emergency: true,
        };
        patient.qrCodeUrl = await generatePatientQrDataUrl(qrPayload);
      }

      const user = await User.findById(patient.userId);
      if (user && patientEmail != null && String(patientEmail).trim()) {
        const email = String(patientEmail).toLowerCase().trim();
        const taken = await User.findOne({ email, _id: { $ne: user._id } });
        if (taken) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }

      await patient.save();

      if (user) {
        user.name = patient.name;
        if (patientPhone != null) user.phone = patientPhone;
        if (patientEmail != null && String(patientEmail).trim()) {
          user.email = String(patientEmail).toLowerCase().trim();
        }
        await user.save();
      }

      await logActivity({
        userId: req.user.userId,
        role: req.user.role,
        action: 'update',
        patientId: patient._id,
        sessionId: req.user.sessionId,
        ipAddress: clientIp(req),
        meta: { type: 'patient_profile' },
      });

      const updated = await Patient.findById(patient._id)
        .populate('userId', 'name email phone')
        .lean();
      res.json(updated);
    } catch (e) {
      console.error(e);
      if (e.code === 11000) {
        return res.status(400).json({ message: 'Duplicate email' });
      }
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get('/:id', authGuard, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('userId', 'name email phone')
      .lean();
    if (!patient) return res.status(404).json({ message: 'Not found' });

    if (req.user.role === 'patient') {
      const own = await Patient.findOne({ userId: req.user.userId });
      if (!own || String(own._id) !== String(req.params.id)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      return res.json(patient);
    }

    if (req.user.role === 'receptionist') {
      await logActivity({
        userId: req.user.userId,
        role: req.user.role,
        action: 'view',
        patientId: patient._id,
        sessionId: req.user.sessionId,
        ipAddress: clientIp(req),
      });
      return res.json(patient);
    }

    if (req.user.role === 'nurse') {
      const lastVital = await Vital.findOne({ patientId: patient._id })
        .sort({ recordedAt: -1 })
        .lean();
      await logActivity({
        userId: req.user.userId,
        role: req.user.role,
        action: 'view',
        patientId: patient._id,
        sessionId: req.user.sessionId,
        ipAddress: clientIp(req),
      });
      return res.json({ ...patient, lastVital });
    }

    if (req.user.role === 'doctor') {
      const has = await doctorHasAccess(patient._id, req.user.userId);
      if (!has) {
        return res.status(403).json({
          message: 'Access not granted by patient',
          _id: patient._id,
          patientId: patient.patientId,
          name: patient.name,
          bloodGroup: patient.bloodGroup,
          needsAccess: true,
        });
      }
      await logActivity({
        userId: req.user.userId,
        role: req.user.role,
        action: 'view',
        patientId: patient._id,
        sessionId: req.user.sessionId,
        ipAddress: clientIp(req),
      });
      return res.json(patient);
    }

    return res.status(403).json({ message: 'Forbidden' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
