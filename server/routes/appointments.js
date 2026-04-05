const express = require('express');
const Appointment = require('../models/Appointment');
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
  '/',
  authGuard,
  roleGuard(['patient']),
  async (req, res) => {
    try {
      const { doctorId, date, time, reason } = req.body;
      if (!doctorId || !date || !time) {
        return res.status(400).json({ message: 'doctorId, date, time required' });
      }
      const patient = await Patient.findOne({ userId: req.user.userId });
      if (!patient) return res.status(404).json({ message: 'Patient not found' });

      const doc = await User.findById(doctorId);
      if (!doc || doc.role !== 'doctor') {
        return res.status(400).json({ message: 'Invalid doctor' });
      }

      const appt = await Appointment.create({
        patientId: patient._id,
        doctorId,
        date: new Date(date),
        time,
        reason,
        status: 'pending',
      });

      await logActivity({
        userId: req.user.userId,
        role: req.user.role,
        action: 'create',
        patientId: patient._id,
        sessionId: req.user.sessionId,
        ipAddress: clientIp(req),
        meta: { appointmentId: appt._id.toString() },
      });

      res.status(201).json(appt);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get('/', authGuard, async (req, res) => {
  try {
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user.userId });
      if (!patient) return res.status(404).json({ message: 'Patient not found' });
      const list = await Appointment.find({ patientId: patient._id })
        .sort({ date: -1 })
        .populate('doctorId', 'name specialty')
        .lean();
      return res.json(list);
    }

    if (req.user.role === 'doctor') {
      const list = await Appointment.find({ doctorId: req.user.userId })
        .sort({ date: -1 })
        .populate('patientId', 'name patientId bloodGroup')
        .lean();
      return res.json(list);
    }

    return res.status(403).json({ message: 'Forbidden' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id', authGuard, roleGuard(['doctor']), async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!['approved', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const appt = await Appointment.findById(req.params.id);
    if (!appt || String(appt.doctorId) !== String(req.user.userId)) {
      return res.status(404).json({ message: 'Not found' });
    }
    appt.status = status;
    if (notes) appt.notes = notes;
    await appt.save();

    await logActivity({
      userId: req.user.userId,
      role: req.user.role,
      action: status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'update',
      patientId: appt.patientId,
      sessionId: req.user.sessionId,
      ipAddress: clientIp(req),
      meta: { appointmentId: appt._id.toString() },
    });

    res.json(appt);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
