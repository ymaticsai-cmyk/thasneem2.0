const AccessControl = require('../models/AccessControl');

async function doctorHasAccess(patientId, doctorId) {
  const ac = await AccessControl.findOne({
    patientId,
    doctorId,
    granted: true,
  });
  return !!ac;
}

module.exports = { doctorHasAccess };
