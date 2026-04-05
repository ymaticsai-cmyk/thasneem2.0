const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },
  action: {
    type: String,
    enum: ['view', 'update', 'create', 'scan', 'login', 'revoke', 'download', 'approve', 'reject'],
    required: true,
  },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  sessionId: String,
  ipAddress: String,
  meta: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
});

activityLogSchema.index({ patientId: 1, timestamp: -1 });
activityLogSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
