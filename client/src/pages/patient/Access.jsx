import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function PatientAccess() {
  const [patient, setPatient] = useState(null);
  const [access, setAccess] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [confirmDoc, setConfirmDoc] = useState(null);

  const load = async () => {
    const { data: p } = await api.get('/patients/me');
    setPatient(p);
    const { data: a } = await api.get(`/access/${p._id}`);
    setAccess(a);
  };

  useEffect(() => {
    load();
    api.get('/users/doctors').then(({ data }) => setDoctors(data));
  }, []);

  const grant = async () => {
    if (!confirmDoc) return;
    await api.post('/access/grant', { doctorId: confirmDoc._id });
    setConfirmDoc(null);
    load();
  };

  const revoke = async (id) => {
    await api.patch(`/access/revoke/${id}`);
    load();
  };

  const filtered = doctors.filter(
    (d) =>
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.email || '').includes(search)
  );

  if (!patient) return <div className="text-slate-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 font-bold text-slate-800">Doctors with access</h2>
        <ul className="space-y-3">
          {access.map((a) => (
            <li
              key={a._id}
              className="flex flex-col items-start justify-between gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0">
                <div className="font-medium">{a.doctorId?.name}</div>
                <div className="text-sm text-slate-500">{a.doctorId?.specialty}</div>
                <div className="text-xs text-slate-400">
                  Since {new Date(a.grantedAt).toLocaleDateString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => revoke(a._id)}
                className="shrink-0 rounded-lg border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
              >
                Revoke
              </button>
            </li>
          ))}
          {!access.length && <li className="text-slate-500">No grants yet</li>}
        </ul>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 font-bold text-slate-800">Grant access</h2>
        <input
          placeholder="Search doctor by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 w-full rounded-xl border border-slate-200 px-3 py-2"
        />
        <ul className="max-h-60 space-y-2 overflow-y-auto">
          {filtered.map((d) => (
            <li key={d._id}>
              <button
                type="button"
                onClick={() => setConfirmDoc(d)}
                className="w-full rounded-lg bg-slate-50 px-3 py-2 text-left text-sm hover:bg-slate-100"
              >
                {d.name} — {d.specialty}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {confirmDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <p className="text-slate-800">
              Grant <strong>{confirmDoc.name}</strong> access to your records?
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDoc(null)}
                className="flex-1 rounded-lg border border-slate-200 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={grant}
                className="flex-1 rounded-lg bg-primary py-2 text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
