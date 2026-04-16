const AccessControl = require('../models/AccessControl');
const DoctorReferral = require('../models/DoctorReferral');

async function doctorHasAccess(patientId, doctorId) {
  const referral = await DoctorReferral.findOne({
    patientId,
    suggestedDoctorId: doctorId,
    status: 'active',
  });
  if (referral) return true;

  // Preserve existing direct patient-granted access while referral flow is added.
  const ac = await AccessControl.findOne({ patientId, doctorId, granted: true });
  return !!ac;
}

module.exports = { doctorHasAccess };
