const express = require('express');
const AccessControl = require('../models/AccessControl');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { logActivity } = require('../utils/logActivity');
const { authGuard } = require('../middleware/authGuard');
const { roleGuard } = require('../middleware/roleGuard');
const { doctorHasAccess } = require('../helpers/access');

const router = express.Router();

function clientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
}

router.post(
  '/grant',
  authGuard,
  roleGuard(['patient']),
  async (req, res) => {
    try {
      const { doctorId } = req.body;
      if (!doctorId) return res.status(400).json({ message: 'doctorId required' });
      const patient = await Patient.findOne({ userId: req.user.userId });
      if (!patient) return res.status(404).json({ message: 'Patient not found' });
      const doc = await User.findById(doctorId);
      if (!doc || doc.role !== 'doctor') {
        return res.status(400).json({ message: 'Invalid doctor' });
      }

      const ac = await AccessControl.findOneAndUpdate(
        { patientId: patient._id, doctorId },
        {
          $set: {
            granted: true,
            grantedAt: new Date(),
            revokedAt: undefined,
          },
        },
        { upsert: true, new: true }
      );

      await logActivity({
        userId: req.user.userId,
        role: req.user.role,
        action: 'create',
        patientId: patient._id,
        sessionId: req.user.sessionId,
        ipAddress: clientIp(req),
        meta: { type: 'access_grant', doctorId },
      });

      res.status(201).json(ac);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.patch(
  '/revoke/:id',
  authGuard,
  roleGuard(['patient']),
  async (req, res) => {
    try {
      const patient = await Patient.findOne({ userId: req.user.userId });
      if (!patient) return res.status(404).json({ message: 'Patient not found' });
      const ac = await AccessControl.findOne({
        _id: req.params.id,
        patientId: patient._id,
      });
      if (!ac) return res.status(404).json({ message: 'Not found' });
      ac.granted = false;
      ac.revokedAt = new Date();
      await ac.save();

      await logActivity({
        userId: req.user.userId,
        role: req.user.role,
        action: 'revoke',
        patientId: patient._id,
        sessionId: req.user.sessionId,
        ipAddress: clientIp(req),
        meta: { doctorId: ac.doctorId.toString() },
      });

      res.json(ac);
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

    const list = await AccessControl.find({ patientId: patient._id, granted: true })
      .populate('doctorId', 'name specialty email')
      .lean();

    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
