const mongoose = require('mongoose');

const prescriptionItemSchema = new mongoose.Schema(
  {
    medicine: String,
    dosage: String,
    frequency: String,
    duration: String,
  },
  { _id: false }
);

const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  diagnosis: String,
  symptoms: [{ type: String }],
  prescription: [prescriptionItemSchema],
  reportFiles: [{ type: String }],
  notes: String,
  date: { type: Date, default: Date.now },
  blockchainId: { type: mongoose.Schema.Types.ObjectId, ref: 'BlockChain' },
  version: { type: Number, default: 1 },
  isArchived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

medicalRecordSchema.index({ patientId: 1, date: -1 });
medicalRecordSchema.index({ doctorId: 1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
