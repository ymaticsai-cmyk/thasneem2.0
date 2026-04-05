const mongoose = require('mongoose');

const takenLogSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    status: { type: String, enum: ['taken', 'missed', 'pending'], default: 'pending' },
  },
  { _id: false }
);

const medicineLineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dosage: String,
    times: [{ type: String }],
    startDate: Date,
    endDate: Date,
    takenLog: [takenLogSchema],
  },
  { _id: true }
);

const medicineReminderSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  recordId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord' },
  medicines: [medicineLineSchema],
  createdAt: { type: Date, default: Date.now },
});

medicineReminderSchema.index({ patientId: 1 });

module.exports = mongoose.model('MedicineReminder', medicineReminderSchema);
