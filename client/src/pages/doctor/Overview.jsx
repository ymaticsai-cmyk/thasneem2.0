import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function DoctorOverview() {
  const [appts, setAppts] = useState([]);

  useEffect(() => {
    api.get('/appointments').then(({ data }) => setAppts(data));
  }, []);

  const today = new Date().toDateString();
  const todayCount = appts.filter((a) => new Date(a.date).toDateString() === today).length;
  const pending = appts.filter((a) => a.status === 'pending').length;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="text-sm text-slate-500">Today&apos;s appointments</div>
        <div className="text-3xl font-bold text-slate-800">{todayCount}</div>
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="text-sm text-slate-500">Pending approvals</div>
        <div className="text-3xl font-bold text-amber-600">{pending}</div>
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="text-sm text-slate-500">Recent activity</div>
        <p className="text-sm text-slate-600">Use Scan / Search to open a patient.</p>
      </div>
    </div>
  );
}
