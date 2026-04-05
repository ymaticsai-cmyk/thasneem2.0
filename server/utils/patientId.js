const Counter = require('../models/Counter');

async function generatePatientId() {
  const year = new Date().getFullYear();
  const key = `patient_${year}`;
  const counter = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const n = String(counter.seq).padStart(4, '0');
  return `PAT-${year}-${n}`;
}

module.exports = { generatePatientId };
