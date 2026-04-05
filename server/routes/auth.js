const express = require('express');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { logActivity } = require('../utils/logActivity');
const {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
} = require('../utils/tokens');
const { authGuard } = require('../middleware/authGuard');

const router = express.Router();
const SALT = 12;

function clientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const sessionId = uuidv4();
    const payload = { userId: user._id.toString(), role: user.role, sessionId };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ userId: user._id.toString(), sessionId });

    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    await logActivity({
      userId: user._id,
      role: user.role,
      action: 'login',
      sessionId,
      ipAddress: clientIp(req),
    });

    res.json({
      accessToken,
      refreshToken,
      token: accessToken,
      role: user.role,
      userId: user._id.toString(),
      sessionId,
      name: user.name,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP required' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.otpHash) {
      return res.status(400).json({ message: 'No pending OTP for this user' });
    }
    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }
    const match = await bcrypt.compare(String(otp), user.otpHash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid OTP' });
    }
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    const sessionId = uuidv4();
    const payload = { userId: user._id.toString(), role: user.role, sessionId };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ userId: user._id.toString(), sessionId });
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    await logActivity({
      userId: user._id,
      role: user.role,
      action: 'login',
      sessionId,
      ipAddress: clientIp(req),
      meta: { via: 'otp' },
    });

    res.json({
      accessToken,
      refreshToken,
      token: accessToken,
      role: user.role,
      userId: user._id.toString(),
      sessionId,
      name: user.name,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken required' });
    }
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshTokenHash !== hashToken(refreshToken)) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    const payload = {
      userId: user._id.toString(),
      role: user.role,
      sessionId: decoded.sessionId || uuidv4(),
    };
    const accessToken = signAccessToken(payload);
    const newRefresh = signRefreshToken({ userId: user._id.toString(), sessionId: payload.sessionId });
    user.refreshTokenHash = hashToken(newRefresh);
    await user.save();
    res.json({ accessToken, refreshToken: newRefresh, token: accessToken });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const { refreshToken: bodyRefresh } = req.body || {};
    const h = req.headers.authorization;
    const bearer = h && h.startsWith('Bearer ') ? h.slice(7) : null;

    let userId = null;
    if (bearer) {
      try {
        const u = verifyAccessToken(bearer);
        userId = u.userId;
      } catch {
        /* expired access token — try refresh below */
      }
    }
    if (!userId && bodyRefresh) {
      try {
        const decoded = verifyRefreshToken(bodyRefresh);
        userId = decoded.userId;
        const user = await User.findById(userId);
        if (user && user.refreshTokenHash === hashToken(bodyRefresh)) {
          user.refreshTokenHash = undefined;
          await user.save();
        }
        return res.json({ ok: true });
      } catch {
        return res.json({ ok: true });
      }
    }
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user.refreshTokenHash = undefined;
        await user.save();
      }
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
module.exports.SALT = SALT;
