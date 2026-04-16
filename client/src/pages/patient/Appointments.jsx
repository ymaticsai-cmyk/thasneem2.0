import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function PatientAppointments() {
  const [list, setList] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ doctorId: '', date: '', time: '', reason: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    api
      .get('/appointments')
      .then(({ data }) => setList(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get('/users/doctors').then(({ data }) => setDoctors(data));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/appointments', {
        ...form,
        date: new Date(form.date).toISOString(),
      });
      setForm({ doctorId: '', date: '', time: '', reason: '' });
      load();
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Failed');
    }
  };

  const badge = (s) => {
    const map = {
      pending: 'bg-amber-100 text-amber-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-emerald-100 text-emerald-800',
    };
    return map[s] || 'bg-slate-100';
  };

  if (loading) return <div className="text-slate-500">Loading…</div>;

  return (
    <div className="space-y-6 sm:space-y-8">
      <form onSubmit={submit} className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 font-bold text-slate-800">Book appointment</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <select
            required
            value={form.doctorId}
            onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2"
          >
            <option value="">Select doctor</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name} — {d.specialty}
              </option>
            ))}
          </select>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
          <input
            type="time"
            required
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
          <input
            placeholder="Reason"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 sm:col-span-2"
          />
        </div>
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        <button
          type="submit"
          className="mt-4 rounded-xl bg-primary px-4 py-2 font-semibold text-white"
        >
          Submit request
        </button>
      </form>

      <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 font-bold text-slate-800">Your appointments</h2>
        <ul className="space-y-3">
          {list.map((a) => (
            <li
              key={a._id}
              className="flex flex-col items-start justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center"
            >
              <div className="min-w-0">
                <div className="font-medium text-slate-800">
                  {new Date(a.date).toLocaleDateString()} {a.time}
                </div>
                <div className="break-words text-sm text-slate-500">
                  Dr. {a.doctorId?.name} — {a.reason}
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs ${badge(a.status)}`}>
                {a.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
