import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function NursePatientList() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get('/patients', { params: { q } }).then(({ data }) => setList(data));
  }, [q]);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <input
        className="mb-4 w-full rounded-xl border border-slate-200 px-3 py-2"
        placeholder="Search…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <ul className="divide-y divide-slate-100">
        {list.map((p) => (
          <li key={p._id} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="font-medium text-slate-800">{p.name}</span>
            <span className="text-slate-500">{p.patientId}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
