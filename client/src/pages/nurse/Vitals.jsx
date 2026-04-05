import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function NurseVitals() {
  const [patientId, setPatientId] = useState(() => sessionStorage.getItem('nurse_vitals_patient') || '');
  const [form, setForm] = useState({
    bloodPressure: '',
    temperature: '',
    pulseRate: '',
    oxygenLevel: '',
    weight: '',
    height: '',
  });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    const id = sessionStorage.getItem('nurse_vitals_patient');
    if (id) setPatientId(id);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      await api.post('/vitals', { patientId, ...form });
      setMsg('Vitals saved');
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Failed');
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-lg rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-bold text-slate-800">Vitals</h2>
      <input
        placeholder="Patient Mongo ID (from scan)"
        value={patientId}
        onChange={(e) => setPatientId(e.target.value)}
        className="mb-4 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm"
        required
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ['bloodPressure', 'Blood pressure'],
          ['temperature', 'Temperature'],
          ['pulseRate', 'Pulse'],
          ['oxygenLevel', 'SpO₂'],
          ['weight', 'Weight'],
          ['height', 'Height'],
        ].map(([k, label]) => (
          <input
            key={k}
            placeholder={label}
            value={form[k]}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
        ))}
      </div>
      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      {msg && <p className="mt-3 text-sm text-emerald-600">{msg}</p>}
      <button
        type="submit"
        className="mt-4 rounded-xl bg-primary px-4 py-2 font-semibold text-white"
      >
        Submit
      </button>
    </form>
  );
}
