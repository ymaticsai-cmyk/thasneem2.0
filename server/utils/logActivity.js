const ActivityLog = require('../models/ActivityLog');

async function logActivity({
  userId,
  role,
  action,
  patientId,
  sessionId,
  ipAddress,
  meta,
}) {
  try {
    await ActivityLog.create({
      userId,
      role,
      action,
      patientId,
      sessionId,
      ipAddress,
      meta,
    });
  } catch (e) {
    console.error('ActivityLog error', e.message);
  }
}

module.exports = { logActivity };
