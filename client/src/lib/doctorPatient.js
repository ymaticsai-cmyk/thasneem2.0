const KEY = 'hhrm_doctor_patient_id';

export function setDoctorPatientId(id) {
  if (id) sessionStorage.setItem(KEY, id);
  else sessionStorage.removeItem(KEY);
}

export function getDoctorPatientId() {
  return sessionStorage.getItem(KEY) || '';
}
