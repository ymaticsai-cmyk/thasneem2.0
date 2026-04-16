import { useEffect, useState } from 'react';
import api from '../../services/api';
import { getDoctorPatientId, setDoctorPatientId } from '../../lib/doctorPatient';
import PatientSelector from '../../components/doctor-suggestion/PatientSelector';
import SpecialistSearch from '../../components/doctor-suggestion/SpecialistSearch';
import SpecialistProfileCard from '../../components/doctor-suggestion/SpecialistProfileCard';
import ReferralActionPanel from '../../components/doctor-suggestion/ReferralActionPanel';
import { Badge, Button, Card, Modal, ProgressSteps } from '../../components/ui';

export default function DoctorSuggestions() {
  const [patientQuery, setPatientQuery] = useState('');
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientError, setPatientError] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [doctorQuery, setDoctorQuery] = useState('');
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorError, setDoctorError] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [selectedDoctorProfile, setSelectedDoctorProfile] = useState(null);

  const [reason, setReason] = useState('');
  const [creatingReferral, setCreatingReferral] = useState(false);
  const [referralError, setReferralError] = useState('');
  const [referralSuccess, setReferralSuccess] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadPatients() {
      try {
        setPatientLoading(true);
        setPatientError('');
        const { data } = await api.get('/patients', { params: { q: patientQuery } });
        if (cancelled) return;
        setPatients(Array.isArray(data) ? data : []);
      } catch (e) {
        if (cancelled) return;
        setPatientError(e.response?.data?.message || 'Failed to load patients');
      } finally {
        if (!cancelled) setPatientLoading(false);
      }
    }
    loadPatients();
    return () => {
      cancelled = true;
    };
  }, [patientQuery]);

  useEffect(() => {
    let cancelled = false;
    async function loadDoctors() {
      try {
        setDoctorLoading(true);
        setDoctorError('');
        const { data } = await api.get('/referrals/doctors/search', { params: { q: doctorQuery } });
        if (cancelled) return;
        setDoctors(Array.isArray(data) ? data : []);
      } catch (e) {
        if (cancelled) return;
        setDoctorError(e.response?.data?.message || 'Failed to load doctors');
      } finally {
        if (!cancelled) setDoctorLoading(false);
      }
    }
    loadDoctors();
    return () => {
      cancelled = true;
    };
  }, [doctorQuery]);

  useEffect(() => {
    const currentPatientId = getDoctorPatientId();
    if (!currentPatientId) return;
    setSelectedPatient((prev) => prev || patients.find((p) => p._id === currentPatientId) || null);
  }, [patients]);

  useEffect(() => {
    let cancelled = false;
    async function loadSelectedDoctorProfile() {
      if (!selectedDoctor?._id) {
        setSelectedDoctorProfile(null);
        setProfileError('');
        return;
      }
      try {
        setProfileLoading(true);
        setProfileError('');
        const { data } = await api.get(`/referrals/doctors/${selectedDoctor._id}/profile`);
        if (cancelled) return;
        setSelectedDoctorProfile(data);
      } catch (e) {
        if (cancelled) return;
        setSelectedDoctorProfile(null);
        setProfileError(e.response?.data?.message || 'Failed to load specialist profile');
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }
    loadSelectedDoctorProfile();
    return () => {
      cancelled = true;
    };
  }, [selectedDoctor]);

  const onSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setDoctorPatientId(patient._id);
    setReferralError('');
    setReferralSuccess('');
  };

  const onSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setReferralError('');
    setReferralSuccess('');
  };

  const createReferral = async () => {
    if (!selectedPatient?._id || !selectedDoctor?._id) {
      setReferralError('Select both patient and specialist doctor');
      return;
    }
    try {
      setCreatingReferral(true);
      setReferralError('');
      setReferralSuccess('');
      await api.post('/referrals', {
        patientId: selectedPatient._id,
        suggestedDoctorId: selectedDoctor._id,
        reason: reason.trim(),
      });
      setReferralSuccess(
        `Referral created. ${selectedDoctor.name} can now access ${selectedPatient.name}'s full patient data.`
      );
      setReason('');
    } catch (e) {
      setReferralError(e.response?.data?.message || 'Failed to create referral');
    } finally {
      setCreatingReferral(false);
    }
  };

  const currentStep = !selectedPatient ? 0 : !selectedDoctor ? 1 : !selectedDoctorProfile ? 2 : 3;

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-fade blur-2xl" />
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-3xl font-semibold">Doctor Suggestion</h2>
          <Badge tone="info">Referral workflow</Badge>
        </div>
        <p className="text-sm text-text-muted">
          Select a patient, suggest a specialist, and create a referral to grant patient-data access.
        </p>
        <div className="mt-4">
          <ProgressSteps
            steps={['Select patient', 'Choose specialist', 'Review profile', 'Confirm access']}
            current={currentStep}
          />
        </div>
      </Card>

      <PatientSelector
        q={patientQuery}
        onSearchChange={setPatientQuery}
        patients={patients}
        loading={patientLoading}
        error={patientError}
        selectedPatientId={selectedPatient?._id}
        onSelectPatient={onSelectPatient}
      />

      <SpecialistSearch
        q={doctorQuery}
        onSearchChange={setDoctorQuery}
        doctors={doctors}
        loading={doctorLoading}
        error={doctorError}
        selectedDoctorId={selectedDoctor?._id}
        onSelectDoctor={onSelectDoctor}
      />

      <SpecialistProfileCard
        profile={selectedDoctorProfile}
        loading={profileLoading}
        error={profileError}
      />

      <ReferralActionPanel
        selectedPatient={selectedPatient}
        selectedDoctor={selectedDoctor}
        reason={reason}
        onReasonChange={setReason}
        onCreateReferral={() => setConfirmOpen(true)}
        creating={creatingReferral}
        error={referralError}
        success={referralSuccess}
      />
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm specialist access">
        <p className="text-sm text-text-muted">
          Confirm referral for <span className="font-semibold text-text">{selectedPatient?.name || 'patient'}</span> to{' '}
          <span className="font-semibold text-text">{selectedDoctor?.name || 'specialist'}</span>. This grants
          patient-data access based on referral policy.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" tone="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={async () => {
              setConfirmOpen(false);
              await createReferral();
            }}
          >
            Confirm and create referral
          </Button>
        </div>
      </Modal>
    </div>
  );
}
