import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function PatientActivity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: p } = await api.get('/patients/me');
        const { data } = await api.get(`/logs/${p._id}`);
        setLogs(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-slate-500">Loading…</div>;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <h2 className="mb-4 font-bold text-slate-800">Activity log</h2>
      <ul className="space-y-3 text-sm text-slate-600">
        {logs.map((log) => (
          <li key={log._id} className="border-b border-slate-100 pb-3">
            {log.display || `${log.action} — ${new Date(log.timestamp).toLocaleString()}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
