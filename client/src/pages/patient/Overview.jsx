import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function PatientOverview() {
  const [patient, setPatient] = useState(null);
  const [logs, setLogs] = useState([]);
  const [appts, setAppts] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: p } = await api.get('/patients/me');
        if (cancelled) return;
        setPatient(p);
        const [{ data: l }, { data: a }] = await Promise.all([
          api.get(`/logs/${p._id}`),
          api.get('/appointments'),
        ]);
        if (!cancelled) {
          setLogs(l.slice(0, 5));
          setAppts(a.filter((x) => new Date(x.date) >= new Date()).slice(0, 3));
        }
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.message || 'Failed to load');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return <div className="rounded-2xl bg-white p-6 text-red-600 shadow-sm">{err}</div>;
  }
  if (!patient) {
    return <div className="text-slate-500">Loading…</div>;
  }

  const downloadQr = () => {
    if (!patient.qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = patient.qrCodeUrl;
    a.download = `qr-${patient.patientId}.png`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Blood group</div>
          <div className="text-xl font-bold text-slate-800">{patient.bloodGroup}</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Allergies</div>
          <div className="text-xl font-bold text-slate-800">{patient.allergies?.length || 0}</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Patient ID</div>
          <div className="text-lg font-semibold text-slate-800">{patient.patientId}</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Upcoming appt.</div>
          <div className="text-sm font-medium text-slate-800">
            {appts[0]
              ? `${new Date(appts[0].date).toLocaleDateString()} — ${appts[0].status}`
              : 'None'}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={downloadQr}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          Download QR (PNG)
        </button>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-bold text-slate-800">Recent activity</h2>
        <ul className="space-y-2 text-sm text-slate-600">
          {logs.map((log) => (
            <li key={log._id} className="border-b border-slate-100 pb-2 last:border-0">
              {log.display || log.action}
            </li>
          ))}
          {!logs.length && <li className="text-slate-400">No activity yet</li>}
        </ul>
      </div>
    </div>
  );
}
