import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../../components/QRScanner';
import api from '../../services/api';

export default function NurseScan() {
  const [patient, setPatient] = useState(null);
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const handleScan = useCallback(
    async (text) => {
      try {
        let patientId = text;
        try {
          const parsed = JSON.parse(text);
          patientId = parsed.patientId || text;
        } catch {
          /* plain id */
        }
        const { data } = await api.get(
          `/patients/by-patient-id/${encodeURIComponent(patientId)}`
        );
        setPatient(data);
        setErr('');
      } catch (e) {
        setErr(e.response?.data?.message || 'Could not load patient');
      }
    },
    []
  );

  return (
    <div className="space-y-6">
      <QRScanner onScan={handleScan} onError={(m) => setErr(m)} />
      {err && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      {patient && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="font-bold text-slate-800">{patient.name}</div>
          <div className="text-sm text-slate-500">{patient.patientId}</div>
          <div className="mt-2 text-sm">
            Blood: {patient.bloodGroup} | Age: {patient.age}
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Allergies: {(patient.allergies || []).join(', ') || '—'}
          </div>
          {patient.lastVital && (
            <div className="mt-3 text-xs text-slate-500">
              Last vitals: {new Date(patient.lastVital.recordedAt).toLocaleString()} — BP{' '}
              {patient.lastVital.bloodPressure || '—'}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem('nurse_vitals_patient', patient._id);
              navigate('/dashboard/nurse/vitals');
            }}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Update vitals
          </button>
        </div>
      )}
    </div>
  );
}
