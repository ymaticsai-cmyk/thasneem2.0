const mongoose = require('mongoose');

const emergencyEventSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  message: { type: String, default: '' },
  triggeredByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

emergencyEventSchema.index({ patientId: 1, createdAt: -1 });

module.exports = mongoose.model('EmergencyEvent', emergencyEventSchema);
