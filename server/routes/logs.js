const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { authGuard } = require('../middleware/authGuard');
const { doctorHasAccess } = require('../helpers/access');

const router = express.Router();

function formatMessage(log) {
  const actor = log.actorName || 'Staff';
  const when = new Date(log.timestamp).toLocaleString();
  switch (log.action) {
    case 'view':
      return `${actor} viewed your records — ${when}`;
    case 'update':
      return `${actor} updated records — ${when}`;
    case 'create':
      return `${actor} created an entry — ${when}`;
    case 'scan':
      return `${actor} scanned your QR — ${when}`;
    case 'login':
      return `Login — ${when}`;
    case 'download':
      return `Report downloaded — ${when}`;
    default:
      return `${log.action} — ${when}`;
  }
}

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
      if (!has) return res.status(403).json({ message: 'Access not granted' });
    } else if (req.user.role !== 'receptionist') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const logs = await ActivityLog.find({ patientId: patient._id })
      .sort({ timestamp: -1 })
      .limit(200)
      .lean();

    const userIds = [...new Set(logs.map((l) => String(l.userId)))];
    const users = await User.find({ _id: { $in: userIds } }).select('name role').lean();
    const nameMap = Object.fromEntries(users.map((u) => [String(u._id), u.name]));

    const enriched = logs.map((l) => ({
      ...l,
      actorName: nameMap[String(l.userId)] || 'User',
      display: formatMessage({ ...l, actorName: nameMap[String(l.userId)] }),
    }));

    res.json(enriched);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
