const mongoose = require('mongoose');

const doctorReferralSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    referringDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    suggestedDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
    },
    reason: { type: String, trim: true, default: '' },
    revokedAt: Date,
  },
  { timestamps: true }
);

doctorReferralSchema.index({ patientId: 1, suggestedDoctorId: 1, status: 1 });
doctorReferralSchema.index({ referringDoctorId: 1, createdAt: -1 });
doctorReferralSchema.index({ suggestedDoctorId: 1, createdAt: -1 });

module.exports = mongoose.model('DoctorReferral', doctorReferralSchema);
