import { useState } from 'react';
import api from '../../services/api';
import { getDoctorPatientId } from '../../lib/doctorPatient';

export default function DoctorDiagnosis() {
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const patientId = getDoctorPatientId();
    if (!patientId) {
      setErr('Select patient from Scan / Search');
      return;
    }
    setErr('');
    try {
      const { data } = await api.post('/records', {
        patientId,
        diagnosis,
        symptoms: symptoms.split(',').map((s) => s.trim()).filter(Boolean),
        notes,
      });
      setMsg(
        data.blockInfo?.txHash
          ? 'Record saved and anchored on Ethereum (see patient records / integrity page).'
          : 'Record saved; integrity hash stored (add ETHEREUM_RPC_URL + ETHEREUM_PRIVATE_KEY to anchor on-chain).'
      );
      setSymptoms('');
      setDiagnosis('');
      setNotes('');
    } catch (e2) {
      const st = e2.response?.status;
      const msg = e2.response?.data?.message;
      setErr(
        st === 502
          ? msg || 'Ethereum anchoring failed — check wallet balance and RPC settings.'
          : msg || 'Failed'
      );
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-bold text-slate-800">Add diagnosis</h2>
      <p className="mb-4 text-sm text-slate-500">
        Patient: {getDoctorPatientId() || '— (use Scan first)'}
      </p>
      <input
        placeholder="Symptoms (comma-separated)"
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
        className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2"
      />
      <textarea
        placeholder="Diagnosis"
        required
        value={diagnosis}
        onChange={(e) => setDiagnosis(e.target.value)}
        className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2"
        rows={3}
      />
      <textarea
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2"
        rows={2}
      />
      {err && <p className="text-sm text-red-600">{err}</p>}
      {msg && <p className="text-sm text-emerald-600">{msg}</p>}
      <button type="submit" className="mt-2 rounded-xl bg-primary px-4 py-2 text-white">
        Save record
      </button>
    </form>
  );
}
