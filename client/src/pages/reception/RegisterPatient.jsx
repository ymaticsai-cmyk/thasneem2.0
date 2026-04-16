import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function RegisterPatient() {
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'O+',
    allergies: '',
    chronicDiseases: '',
    ecName: '',
    ecPhone: '',
    ecRelation: '',
    patientEmail: '',
    patientPassword: '',
  });
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const { data } = await api.post('/patients', {
        name: form.name,
        age: Number(form.age),
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        allergies: form.allergies.split(',').map((s) => s.trim()).filter(Boolean),
        chronicDiseases: form.chronicDiseases.split(',').map((s) => s.trim()).filter(Boolean),
        emergencyContact: {
          name: form.ecName,
          phone: form.ecPhone,
          relation: form.ecRelation,
        },
        patientEmail: form.patientEmail || undefined,
        patientPassword: form.patientPassword || undefined,
      });
      setResult(data);
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const printQr = () => {
    const w = window.open('', '_blank');
    if (w && result?.patient?.qrCodeUrl) {
      w.document.write(`<img src="${result.patient.qrCodeUrl}" onload="window.print()"/>`);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <form onSubmit={submit} className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 font-bold text-slate-800">Register patient</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 sm:col-span-2"
          />
          <input
            required
            type="number"
            placeholder="Age"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2"
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
          <input
            required
            placeholder="Blood group"
            value={form.bloodGroup}
            onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
          <input
            placeholder="Allergies (comma-separated)"
            value={form.allergies}
            onChange={(e) => setForm({ ...form, allergies: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 sm:col-span-2"
          />
          <input
            placeholder="Chronic diseases (comma-separated)"
            value={form.chronicDiseases}
            onChange={(e) => setForm({ ...form, chronicDiseases: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 sm:col-span-2"
          />
          <input
            required
            placeholder="Emergency contact name"
            value={form.ecName}
            onChange={(e) => setForm({ ...form, ecName: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
          <input
            required
            placeholder="Emergency phone"
            value={form.ecPhone}
            onChange={(e) => setForm({ ...form, ecPhone: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
          <input
            required
            placeholder="Relation"
            value={form.ecRelation}
            onChange={(e) => setForm({ ...form, ecRelation: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 sm:col-span-2"
          />
          <input
            type="email"
            placeholder="Patient login email (optional)"
            value={form.patientEmail}
            onChange={(e) => setForm({ ...form, patientEmail: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
          <input
            type="password"
            placeholder="Patient password (optional)"
            value={form.patientPassword}
            onChange={(e) => setForm({ ...form, patientPassword: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
        </div>
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 rounded-xl bg-primary px-4 py-2 font-semibold text-white"
        >
          {loading ? 'Saving…' : 'Register & generate QR'}
        </button>
      </form>

      {result?.patient && (
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <div className="font-semibold text-slate-800">
            {result.patient.patientId}
          </div>
          {result.patientLogin && (
            <p className="mt-2 text-sm text-slate-600">
              Login: {result.patientLogin.email} / {result.patientLogin.password}
            </p>
          )}
          <div className="mt-4 flex justify-center">
            <img src={result.patient.qrCodeUrl} alt="QR" className="max-w-xs rounded-xl" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to={`/dashboard/receptionist/patients/${result.patient._id}`}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white"
            >
              View / edit details
            </Link>
            <a
              href={result.patient.qrCodeUrl}
              download={`qr-${result.patient.patientId}.png`}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-white"
            >
              Download PNG
            </a>
            <button
              type="button"
              onClick={printQr}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
            >
              Print
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
