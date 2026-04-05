const crypto = require('crypto');

function sha256(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

function normalizeDoctorId(doc) {
  const d = doc.doctorId;
  if (d && typeof d === 'object' && d._id) return String(d._id);
  return String(d || '');
}

function buildMedicalRecordHashPayload(record) {
  const doc = record.toObject ? record.toObject() : record;
  return {
    diagnosis: doc.diagnosis || '',
    prescription: doc.prescription || [],
    date: doc.date ? new Date(doc.date).toISOString() : '',
    doctorId: normalizeDoctorId(doc),
    symptoms: doc.symptoms || [],
    notes: doc.notes || '',
  };
}

module.exports = { sha256, buildMedicalRecordHashPayload };
