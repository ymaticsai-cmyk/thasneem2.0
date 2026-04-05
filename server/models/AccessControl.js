const mongoose = require('mongoose');

const accessControlSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  granted: { type: Boolean, default: true },
  grantedAt: { type: Date, default: Date.now },
  revokedAt: Date,
});

accessControlSchema.index({ patientId: 1, doctorId: 1 }, { unique: true });

module.exports = mongoose.model('AccessControl', accessControlSchema);
