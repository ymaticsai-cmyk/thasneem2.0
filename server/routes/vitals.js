const express = require('express');
const Vital = require('../models/Vital');
const Patient = require('../models/Patient');
const { logActivity } = require('../utils/logActivity');
const { authGuard } = require('../middleware/authGuard');
const { roleGuard } = require('../middleware/roleGuard');
const { doctorHasAccess } = require('../helpers/access');

const router = express.Router();

function clientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
}

router.post(
  '/',
  authGuard,
  roleGuard(['nurse']),
  async (req, res) => {
    try {
      const {
        patientId,
        bloodPressure,
        temperature,
        pulseRate,
        oxygenLevel,
        weight,
        height,
      } = req.body;
      if (!patientId) {
        return res.status(400).json({ message: 'patientId required' });
      }
      const patient = await Patient.findById(patientId);
      if (!patient) return res.status(404).json({ message: 'Patient not found' });

      const v = await Vital.create({
        patientId,
        nurseId: req.user.userId,
        bloodPressure,
        temperature,
        pulseRate,
        oxygenLevel,
        weight,
        height,
      });

      await logActivity({
        userId: req.user.userId,
        role: req.user.role,
        action: 'update',
        patientId: patient._id,
        sessionId: req.user.sessionId,
        ipAddress: clientIp(req),
        meta: { type: 'vitals' },
      });

      res.status(201).json(v);
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

    if (req.user.role === 'nurse') {
      const list = await Vital.find({ patientId: patient._id })
        .sort({ recordedAt: -1 })
        .limit(100)
        .populate('nurseId', 'name')
        .lean();
      return res.json(list);
    }

    if (req.user.role === 'doctor') {
      const has = await doctorHasAccess(patient._id, req.user.userId);
      if (!has) return res.status(403).json({ message: 'Access not granted' });
      const list = await Vital.find({ patientId: patient._id })
        .sort({ recordedAt: -1 })
        .limit(100)
        .populate('nurseId', 'name')
        .lean();
      await logActivity({
        userId: req.user.userId,
        role: req.user.role,
        action: 'view',
        patientId: patient._id,
        sessionId: req.user.sessionId,
        ipAddress: clientIp(req),
        meta: { type: 'vitals' },
      });
      return res.json(list);
    }

    if (req.user.role === 'patient') {
      const own = await Patient.findOne({ userId: req.user.userId });
      if (!own || String(own._id) !== String(patient._id)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      const list = await Vital.find({ patientId: patient._id })
        .sort({ recordedAt: -1 })
        .limit(100)
        .lean();
      return res.json(list);
    }

    return res.status(403).json({ message: 'Forbidden' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
