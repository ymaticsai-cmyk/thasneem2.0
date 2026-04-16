const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'nurse', 'receptionist'],
    required: true,
  },
  phone: String,
  specialty: String,
  regNo: String,
  refreshTokenHash: String,
  otpHash: String,
  otpExpiresAt: Date,
  /** Latest Web Push subscription (PushSubscription JSON); one device — resubscribe overwrites */
  pushSubscription: { type: mongoose.Schema.Types.Mixed, default: undefined },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
