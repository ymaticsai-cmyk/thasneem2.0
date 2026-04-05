const express = require('express');
const User = require('../models/User');
const { authGuard } = require('../middleware/authGuard');

const router = express.Router();

router.get('/doctors', authGuard, async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' })
      .select('name email specialty regNo')
      .lean();
    res.json(doctors);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
