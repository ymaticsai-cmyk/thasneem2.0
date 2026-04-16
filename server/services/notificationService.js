const webpush = require('web-push');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const AccessControl = require('../models/AccessControl');
const { verifyAccessToken } = require('../utils/tokens');

let ioRef = null;

function configureWebPush() {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
  if (pub && priv) {
    try {
      webpush.setVapidDetails(subject, pub, priv);
    } catch (e) {
      console.error('[notifications] VAPID setup failed', e.message);
    }
  }
}

configureWebPush();

function isVapidReady() {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

/**
 * @param {import('socket.io').Server} io
 */
function initNotificationService(io) {
  ioRef = io;
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== 'string') {
      return next(new Error('Unauthorized'));
    }
    try {
      const payload = verifyAccessToken(token);
      socket.userId = String(payload.userId);
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.userId;
    if (uid) {
      socket.join(`user:${uid}`);
    }
    socket.on('disconnect', () => {});
  });
}

function roomForUser(userId) {
  return `user:${String(userId)}`;
}

async function persistAndEmitSocket(docPayload) {
  const n = await Notification.create(docPayload);
  const lean = n.toObject();
  const payload = {
    id: lean._id.toString(),
    userId: lean.userId.toString(),
    type: lean.type,
    title: lean.title,
    body: lean.body,
    routeLink: lean.routeLink || '',
    isRead: lean.isRead,
    priority: lean.priority,
    createdAt: lean.createdAt,
  };
  if (ioRef) {
    ioRef.to(roomForUser(lean.userId)).emit('notification', payload);
  }
  return lean;
}

/**
 * In-app + realtime only. Never sends Web Push.
 */
function toUserObjectId(userId) {
  if (userId instanceof mongoose.Types.ObjectId) return userId;
  return new mongoose.Types.ObjectId(String(userId));
}

async function emitInApp({ userId, type, title, body, routeLink = '', priority = 'normal' }) {
  if (!userId) return;
  try {
    const uid = toUserObjectId(userId);
    await persistAndEmitSocket({
      userId: uid,
      type,
      title,
      body: body || '',
      routeLink: routeLink || '',
      isRead: false,
      priority: priority === 'emergency' ? 'emergency' : 'normal',
    });
  } catch (e) {
    console.error('[notifications] emitInApp failed', e.message);
  }
}

async function sendWebPushToUser(userId, { title, body, routeLink }) {
  if (!isVapidReady()) return;
  let uidStr = String(userId);
  try {
    const user = await User.findById(userId).select('pushSubscription').lean();
    const sub = user?.pushSubscription;
    if (!sub || !sub.endpoint) return;

    const payload = JSON.stringify({
      title: title || 'Notification',
      body: body || '',
      routeLink: routeLink || '/',
    });
    await webpush.sendNotification(sub, payload, {
      TTL: 60,
      urgency: 'high',
    });
  } catch (err) {
    const code = err.statusCode;
    if (code === 410 || code === 404) {
      try {
        await User.findByIdAndUpdate(userId, { $unset: { pushSubscription: 1 } });
      } catch (_) {}
    }
    console.error('[web-push]', uidStr, err.message || err);
  }
}

/**
 * Emergency: in-app for each granted doctor + Web Push per doctor (push only here).
 */
async function emitEmergencyForPatient({
  patientId,
  title,
  body,
  routeLink = '/dashboard/doctor',
}) {
  if (!patientId) return;
  try {
    const pid =
      patientId instanceof mongoose.Types.ObjectId
        ? patientId
        : new mongoose.Types.ObjectId(String(patientId));
    const grants = await AccessControl.find({ patientId: pid, granted: true }).select('doctorId').lean();
    for (const g of grants) {
      const doctorUserId = g.doctorId;
      await emitInApp({
        userId: doctorUserId,
        type: 'emergency',
        title,
        body,
        routeLink,
        priority: 'emergency',
      });
      await sendWebPushToUser(doctorUserId, { title, body, routeLink });
    }
  } catch (e) {
    console.error('[notifications] emitEmergencyForPatient failed', e.message);
  }
}

module.exports = {
  initNotificationService,
  emitInApp,
  emitEmergencyForPatient,
};
