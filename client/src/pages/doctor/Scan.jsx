import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../../components/QRScanner';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { setDoctorPatientId } from '../../lib/doctorPatient';

const DIAGNOSIS_PATH = '/dashboard/doctor/diagnosis';

export default function DoctorScan() {
  const navigate = useNavigate();
  const { name: doctorName } = useAuth();
  const [q, setQ] = useState('');
  const [patient, setPatient] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigateLockRef = useRef(false);

  const goToDiagnosisIfAllowed = useCallback(
    (data) => {
      if (!data?._id || data.needsAccess || navigateLockRef.current) return;
      navigateLockRef.current = true;
      navigate(DIAGNOSIS_PATH);
    },
    [navigate]
  );

  const loadById = async (mongoId) => {
    setLoading(true);
    setErr('');
    try {
      const { data } = await api.get(`/patients/${mongoId}`);
      setPatient(data);
      setDoctorPatientId(data._id);
    } catch (e) {
      const d = e.response?.data;
      if (d?.needsAccess) {
        setPatient(d);
        setDoctorPatientId('');
      } else {
        setErr(d?.message || 'Not found');
        setPatient(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const search = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const { data } = await api.get('/patients', { params: { q } });
      if (data[0]) {
        await loadById(data[0]._id);
      } else {
        setErr('No patients match');
        setPatient(null);
      }
    } catch (e) {
      setErr(e.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = useCallback(
    async (text) => {
      try {
        let pid = text;
        try {
          const parsed = JSON.parse(text);
          pid = parsed.patientId || text;
        } catch {
          /* ignore */
        }
        const { data } = await api.get(`/patients/by-patient-id/${encodeURIComponent(pid)}`);
        setPatient(data);
        setDoctorPatientId(data._id);
        setErr('');
        goToDiagnosisIfAllowed(data);
      } catch (e) {
        const d = e.response?.data;
        if (d?.needsAccess) {
          navigateLockRef.current = false;
          setPatient(d);
          setDoctorPatientId('');
        } else {
          navigateLockRef.current = false;
          setErr(d?.message || 'Scan failed');
        }
      }
    },
    [goToDiagnosisIfAllowed]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <form onSubmit={search} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <input
          className="w-full min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2"
          placeholder="Search name, ID, blood group…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-4 py-2 text-white sm:w-auto"
          disabled={loading}
        >
          Search
        </button>
      </form>

      <div className="max-w-md">
        <QRScanner onScan={handleScan} onError={(m) => setErr(m)} />
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}

      {patient && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="font-bold text-slate-800">{patient.name}</div>
          <div className="text-sm text-slate-500">{patient.patientId}</div>
          {patient.needsAccess ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Access not granted yet</p>
              <p className="mt-2 text-amber-800">
                This patient must allow you to view their records (privacy rule). Ask them to:
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-amber-900">
                <li>Log in to the patient portal.</li>
                <li>Open <strong>Access Control</strong> in the sidebar.</li>
                <li>
                  Tap <strong>Grant access</strong> and choose{' '}
                  <strong>{doctorName || 'your doctor'}</strong>.
                </li>
              </ol>
              <p className="mt-3 text-xs text-amber-800/90">
                After they grant access, use <strong>Search</strong> again or rescan the QR — then
                Medical Records, Diagnosis, and Prescription will unlock.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm font-medium text-emerald-700">
              Access OK — open <strong>Medical Records</strong> or <strong>Add Diagnosis</strong> in
              the sidebar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
