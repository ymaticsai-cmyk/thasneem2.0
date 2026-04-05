require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const patientsRoutes = require('./routes/patients');
const emergencyRoutes = require('./routes/emergency');
const recordsRoutes = require('./routes/records');
const vitalsRoutes = require('./routes/vitals');
const prescriptionsRoutes = require('./routes/prescriptions');
const remindersRoutes = require('./routes/reminders');
const appointmentsRoutes = require('./routes/appointments');
const accessRoutes = require('./routes/access');
const blockchainRoutes = require('./routes/blockchain');
const logsRoutes = require('./routes/logs');
const uploadsRoutes = require('./routes/uploads');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '12mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/users', usersRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hospital_hrm')
  .then(() => {
    app.listen(PORT, () => console.log(`API listening on ${PORT}`));
  })
  .catch((e) => {
    console.error('MongoDB connection failed', e);
    process.exit(1);
  });
