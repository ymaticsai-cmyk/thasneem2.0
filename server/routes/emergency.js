const express = require('express');
const Patient = require('../models/Patient');

const router = express.Router();

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
