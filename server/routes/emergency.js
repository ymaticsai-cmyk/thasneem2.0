const express = require('express');
const Patient = require('../models/Patient');
const EmergencyEvent = require('../models/EmergencyEvent');
const { authGuard } = require('../middleware/authGuard');
const { roleGuard } = require('../middleware/roleGuard');
const { emitEmergencyForPatient } = require('../services/notificationService');

const router = express.Router();

router.post('/record', authGuard, roleGuard(['patient']), async (req, res) => {
  try {
    const message = req.body?.message ? String(req.body.message).trim().slice(0, 2000) : '';
    const patient = await Patient.findOne({ userId: req.user.userId });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    await EmergencyEvent.create({
      patientId: patient._id,
      message,
      triggeredByUserId: req.user.userId,
    });

    await emitEmergencyForPatient({
      patientId: patient._id,
      title: 'Emergency alert',
      body: message
        ? `${patient.name} triggered an emergency: ${message}`
        : `${patient.name} triggered an emergency alert.`,
      routeLink: '/dashboard/doctor',
    });

    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:patientId', async (req, res) => {
  try {
    let patient;
    if (req.params.patientId.startsWith('PAT-')) {
      patient = await Patient.findOne({ patientId: req.params.patientId }).lean();
    } else {
      patient = await Patient.findById(req.params.patientId).lean();
    }
    if (!patient) return res.status(404).json({ message: 'Not found' });
    res.json({
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies || [],
      emergencyContact: patient.emergencyContact,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
