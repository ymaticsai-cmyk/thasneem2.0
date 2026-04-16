const express = require('express');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { authGuard } = require('../middleware/authGuard');

const router = express.Router();

router.get('/push/vapid-public-key', authGuard, (_req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(503).json({ message: 'Push not configured' });
  }
  res.json({ publicKey });
});

router.post('/push/subscribe', authGuard, async (req, res) => {
  try {
    const sub = req.body;
    if (!sub || !sub.endpoint) {
      return res.status(400).json({ message: 'Invalid subscription' });
    }
    await User.findByIdAndUpdate(req.user.userId, { $set: { pushSubscription: sub } });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/push/unsubscribe', authGuard, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, { $unset: { pushSubscription: 1 } });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/unread-count', authGuard, async (req, res) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user.userId);
    const count = await Notification.countDocuments({ userId: uid, isRead: false });
    res.json({ count });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', authGuard, async (req, res) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user.userId);
    const unreadOnly = String(req.query.unreadOnly || '') === 'true';
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10) || 50, 100);
    const skip = Math.max(parseInt(String(req.query.skip || '0'), 10) || 0, 0);
    const q = { userId: uid };
    if (unreadOnly) q.isRead = false;
    const items = await Notification.find(q)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const out = items.map((n) => ({
      id: n._id.toString(),
      userId: n.userId.toString(),
      type: n.type,
      title: n.title,
      body: n.body,
      routeLink: n.routeLink || '',
      isRead: n.isRead,
      priority: n.priority,
      createdAt: n.createdAt,
    }));
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/read-all', authGuard, async (req, res) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user.userId);
    await Notification.updateMany({ userId: uid, isRead: false }, { $set: { isRead: true } });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/read', authGuard, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }
    const uid = new mongoose.Types.ObjectId(req.user.userId);
    const n = await Notification.findOneAndUpdate(
      { _id: id, userId: uid },
      { $set: { isRead: true } },
      { new: true }
    ).lean();
    if (!n) return res.status(404).json({ message: 'Not found' });
    res.json({
      id: n._id.toString(),
      userId: n.userId.toString(),
      type: n.type,
      title: n.title,
      body: n.body,
      routeLink: n.routeLink || '',
      isRead: n.isRead,
      priority: n.priority,
      createdAt: n.createdAt,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authGuard, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }
    const uid = new mongoose.Types.ObjectId(req.user.userId);
    const deleted = await Notification.findOneAndDelete({ _id: id, userId: uid }).lean();
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
