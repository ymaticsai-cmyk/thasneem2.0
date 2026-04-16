const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  routeLink: { type: String, default: '' },
  isRead: { type: Boolean, default: false, index: true },
  priority: { type: String, enum: ['normal', 'emergency'], default: 'normal' },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
