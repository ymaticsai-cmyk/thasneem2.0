const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Patient = require('../models/Patient');
const DoctorReferral = require('../models/DoctorReferral');
const { authGuard } = require('../middleware/authGuard');
const { roleGuard } = require('../middleware/roleGuard');
const { logActivity } = require('../utils/logActivity');
const { emitInApp } = require('../services/notificationService');

const router = express.Router();

function clientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
}

router.get('/doctors/search', authGuard, roleGuard(['doctor']), async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const filter = {
      role: 'doctor',
      _id: { $ne: req.user.userId },
    };
    if (q) {
      filter.$or = [{ name: new RegExp(q, 'i') }, { specialty: new RegExp(q, 'i') }];
    }

    const doctors = await User.find(filter).select('name specialty regNo email').limit(50).lean();
    res.json(doctors);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/doctors/:doctorId/profile', authGuard, roleGuard(['doctor']), async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: 'Invalid doctor id' });
    }

    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' })
      .select('name email specialty regNo phone')
      .lean();
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    res.json(doctor);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authGuard, roleGuard(['doctor']), async (req, res) => {
  try {
    const { patientId, suggestedDoctorId, reason } = req.body;
    if (!patientId || !suggestedDoctorId) {
      return res.status(400).json({ message: 'patientId and suggestedDoctorId required' });
    }
    if (!mongoose.Types.ObjectId.isValid(patientId) || !mongoose.Types.ObjectId.isValid(suggestedDoctorId)) {
      return res.status(400).json({ message: 'Invalid patientId or suggestedDoctorId' });
    }
    if (String(suggestedDoctorId) === String(req.user.userId)) {
      return res.status(400).json({ message: 'You cannot refer a patient to yourself' });
    }

    const patient = await Patient.findById(patientId).lean();
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const suggestedDoctor = await User.findOne({ _id: suggestedDoctorId, role: 'doctor' }).lean();
    if (!suggestedDoctor) return res.status(400).json({ message: 'Invalid doctor' });

    const referral = await DoctorReferral.findOneAndUpdate(
      {
        patientId,
        referringDoctorId: req.user.userId,
        suggestedDoctorId,
      },
      {
        $set: {
          status: 'active',
          reason: reason ? String(reason).trim() : '',
          revokedAt: undefined,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await logActivity({
      userId: req.user.userId,
      role: req.user.role,
      action: 'create',
      patientId,
      sessionId: req.user.sessionId,
      ipAddress: clientIp(req),
      meta: { type: 'doctor_referral', suggestedDoctorId },
    });

    const refDoc = await User.findById(req.user.userId).select('name').lean();
    const fromName = refDoc?.name || 'A doctor';
    await emitInApp({
      userId: suggestedDoctorId,
      type: 'referral',
      title: 'New patient referral',
      body: `${fromName} referred ${patient.name} to you.`,
      routeLink: '/dashboard/doctor/suggestions',
    });

    const populated = await DoctorReferral.findById(referral._id)
      .populate('patientId', 'patientId name bloodGroup')
      .populate('referringDoctorId', 'name specialty')
      .populate('suggestedDoctorId', 'name specialty regNo')
      .lean();
    res.status(201).json(populated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/incoming', authGuard, roleGuard(['doctor']), async (req, res) => {
  try {
    const referrals = await DoctorReferral.find({
      suggestedDoctorId: req.user.userId,
      status: 'active',
    })
      .sort({ createdAt: -1 })
      .populate('patientId', 'patientId name bloodGroup age gender')
      .populate('referringDoctorId', 'name specialty regNo')
      .lean();
    res.json(referrals);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
