const mongoose = require('mongoose');

const vitalSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  nurseId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bloodPressure: String,
  temperature: String,
  pulseRate: String,
  oxygenLevel: String,
  weight: String,
  height: String,
  recordedAt: { type: Date, default: Date.now },
});

vitalSchema.index({ patientId: 1, recordedAt: -1 });

module.exports = mongoose.model('Vital', vitalSchema);
