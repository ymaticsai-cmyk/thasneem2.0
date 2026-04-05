import { useEffect, useState } from 'react';
import api from '../../services/api';
import { setDoctorPatientId } from '../../lib/doctorPatient';

export default function DoctorAllPatients() {
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
          <li key={p._id} className="flex justify-between py-3">
            <div>
              <div className="font-medium text-slate-800">{p.name}</div>
              <div className="text-sm text-slate-500">{p.patientId}</div>
            </div>
            <button
              type="button"
              onClick={() => setDoctorPatientId(p._id)}
              className="text-sm text-primary"
            >
              Select for records
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
