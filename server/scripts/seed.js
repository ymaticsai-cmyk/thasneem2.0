require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../models/User');
const Patient = require('../models/Patient');
const AccessControl = require('../models/AccessControl');
const { SALT } = require('../routes/auth');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hospital_hrm');

  const pass = await bcrypt.hash('Password123!', SALT);

  const roles = [
    { email: 'doctor@hospital.test', name: 'Dr. Ananya Rao', role: 'doctor', specialty: 'General Medicine', regNo: 'DOC-1001' },
    { email: 'doctor2@hospital.test', name: 'Dr. harish', role: 'doctor', specialty: 'neurologist', regNo: 'DOC-1002' },
    { email: 'doctor3@hospital.test', name: 'Dr. banu', role: 'doctor', specialty: 'General Medicine', regNo: 'DOC-1003' },
    { email: 'nurse@hospital.test', name: 'Nurse Priya', role: 'nurse' },
    { email: 'reception@hospital.test', name: 'Reception Meera', role: 'receptionist' },
    { email: 'patient@hospital.test', name: 'Ravi Kumar', role: 'patient' },
  ];

  const users = {};
  for (const r of roles) {
    let u = await User.findOne({ email: r.email });
    if (!u) {
      u = await User.create({
        name: r.name,
        email: r.email,
        password: pass,
        role: r.role,
        specialty: r.specialty,
        regNo: r.regNo,
      });
    } else {
      u.password = pass;
      u.name = r.name;
      if (r.specialty) u.specialty = r.specialty;
      if (r.regNo) u.regNo = r.regNo;
      await u.save();
    }
    users[r.role] = u;
  }

  let patientDoc = await Patient.findOne({ userId: users.patient._id });
  if (!patientDoc) {
    const { generatePatientId } = require('../utils/patientId');
    const { generatePatientQrDataUrl } = require('../utils/qrGenerator');
    const pid = await generatePatientId();
    const qrPayload = { patientId: pid, name: 'Ravi Kumar', bloodGroup: 'O+', emergency: true };
    const qrCodeUrl = await generatePatientQrDataUrl(qrPayload);
    patientDoc = await Patient.create({
      userId: users.patient._id,
      patientId: pid,
      name: 'Ravi Kumar',
      age: 42,
      gender: 'Male',
      bloodGroup: 'O+',
      allergies: ['Penicillin'],
      chronicDiseases: ['Hypertension'],
      emergencyContact: { name: 'Sunita Kumar', phone: '9876543210', relation: 'Spouse' },
      qrCodeUrl,
      createdBy: users.receptionist._id,
    });
  }

  await AccessControl.findOneAndUpdate(
    { patientId: patientDoc._id, doctorId: users.doctor._id },
    { $set: { granted: true, grantedAt: new Date() }, $unset: { revokedAt: 1 } },
    { upsert: true }
  );

  console.log('Seed complete. Login with any:');
  console.log('  doctor@hospital.test / Password123!');
  console.log('  patient@hospital.test / Password123!');
  console.log('  reception@hospital.test / Password123!');
  console.log('  nurse@hospital.test / Password123!');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
