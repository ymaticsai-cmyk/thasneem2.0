import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function DoctorAppointments() {
  const [list, setList] = useState([]);
  const [note, setNote] = useState('');

  const load = () => api.get('/appointments').then(({ data }) => setList(data));

  useEffect(() => {
    load();
  }, []);

  const act = async (id, status) => {
    await api.patch(`/appointments/${id}`, { status, notes: note });
    setNote('');
    load();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-bold text-slate-800">Pending</h2>
        <textarea
          placeholder="Optional note for approve/reject"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mb-4 w-full rounded-xl border border-slate-200 px-3 py-2"
          rows={2}
        />
        <ul className="space-y-3">
          {list
            .filter((a) => a.status === 'pending')
            .map((a) => (
              <li
                key={a._id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3"
              >
                <div>
                  <div className="font-medium">{a.patientId?.name}</div>
                  <div className="text-sm text-slate-500">
                    {new Date(a.date).toLocaleDateString()} {a.time} — {a.reason}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => act(a._id, 'approved')}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => act(a._id, 'rejected')}
                    className="rounded-lg bg-red-600 px-3 py-1 text-sm text-white"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
        </ul>
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-bold text-slate-800">All</h2>
        <ul className="space-y-2 text-sm">
          {list.map((a) => (
            <li key={a._id}>
              {new Date(a.date).toLocaleDateString()} {a.time} — {a.status} —{' '}
              {a.patientId?.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
