const express = require('express');
const MedicineReminder = require('../models/MedicineReminder');
const Patient = require('../models/Patient');
const { logActivity } = require('../utils/logActivity');
const { authGuard } = require('../middleware/authGuard');
const { roleGuard } = require('../middleware/roleGuard');

const router = express.Router();

function clientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

router.get('/', authGuard, roleGuard(['patient']), async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.userId });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const reminders = await MedicineReminder.find({ patientId: patient._id }).lean().exec();

    const now = new Date();
    for (const r of reminders) {
      for (const med of r.medicines || []) {
        for (const t of med.times || []) {
          const [h, m] = t.split(':').map(Number);
          const slot = new Date(now);
          slot.setHours(h, m, 0, 0);
          const oneHr = 60 * 60 * 1000;
          const logForDay =
            med.takenLog?.find(
              (l) =>
                startOfDay(l.date).getTime() === startOfDay(now).getTime() &&
                Math.abs(new Date(l.date).getHours() - h) < 2
            ) || null;
          if (!logForDay && now - slot > oneHr && now > slot) {
            med.takenLog = med.takenLog || [];
            med.takenLog.push({
              date: slot,
              status: 'missed',
            });
          }
        }
      }
    }

    res.json(reminders);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/taken', authGuard, roleGuard(['patient']), async (req, res) => {
  try {
    const { medicineIndex, timeSlot } = req.body;
    const patient = await Patient.findOne({ userId: req.user.userId });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const doc = await MedicineReminder.findOne({
      _id: req.params.id,
      patientId: patient._id,
    });
    if (!doc) return res.status(404).json({ message: 'Not found' });

    const idx = medicineIndex ?? 0;
    if (!doc.medicines[idx]) {
      return res.status(400).json({ message: 'Invalid medicine index' });
    }
    doc.medicines[idx].takenLog = doc.medicines[idx].takenLog || [];
    doc.medicines[idx].takenLog.push({
      date: new Date(),
      status: 'taken',
    });
    await doc.save();

    await logActivity({
      userId: req.user.userId,
      role: req.user.role,
      action: 'update',
      patientId: patient._id,
      sessionId: req.user.sessionId,
      ipAddress: clientIp(req),
      meta: { type: 'reminder_taken', timeSlot },
    });

    res.json(doc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
