const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const { logActivity } = require('../utils/logActivity');
const { authGuard } = require('../middleware/authGuard');
const { roleGuard } = require('../middleware/roleGuard');
const { doctorHasAccess } = require('../helpers/access');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['application/pdf', 'image/jpeg', 'image/png'].includes(file.mimetype);
    cb(ok ? null : new Error('Invalid file type'), ok);
  },
});

function clientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
}

router.post(
  '/',
  authGuard,
  roleGuard(['doctor']),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'file required' });
      }
      const { patientId, recordId } = req.body;
      if (!patientId) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'patientId required' });
      }
      const patient = await Patient.findById(patientId);
      if (!patient) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Patient not found' });
      }
      const has = await doctorHasAccess(patient._id, req.user.userId);
      if (!has) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ message: 'Access not granted' });
      }

      const relPath = `/uploads/${req.file.filename}`;
      let record;
      if (recordId) {
        record = await MedicalRecord.findById(recordId);
        if (!record) {
          fs.unlinkSync(req.file.path);
          return res.status(404).json({ message: 'Record not found' });
        }
        record.reportFiles = record.reportFiles || [];
        record.reportFiles.push(relPath);
        await record.save();
      } else {
        record = await MedicalRecord.create({
          patientId,
          doctorId: req.user.userId,
          diagnosis: 'Report upload',
          reportFiles: [relPath],
          date: new Date(),
        });
      }

      await logActivity({
        userId: req.user.userId,
        role: req.user.role,
        action: 'create',
        patientId: patient._id,
        sessionId: req.user.sessionId,
        ipAddress: clientIp(req),
        meta: { file: relPath },
      });

      res.status(201).json({ path: relPath, record });
    } catch (e) {
      console.error(e);
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ message: e.message || 'Server error' });
    }
  }
);

router.get('/:filename', authGuard, async (req, res) => {
  try {
    const safe = path.basename(req.params.filename);
    const filePath = path.join(UPLOAD_DIR, safe);
    if (!filePath.startsWith(UPLOAD_DIR)) {
      return res.status(400).json({ message: 'Invalid path' });
    }
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Not found' });
    }

    if (req.user.role === 'doctor') {
      res.sendFile(filePath);
      return;
    }
    if (req.user.role === 'patient') {
      res.sendFile(filePath);
      return;
    }
    if (req.user.role === 'nurse' || req.user.role === 'receptionist') {
      res.sendFile(filePath);
      return;
    }
    return res.status(403).json({ message: 'Forbidden' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
