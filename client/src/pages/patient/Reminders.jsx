import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

export default function PatientReminders() {
  const [reminders, setReminders] = useState([]);
  const [day, setDay] = useState(() => new Date());
  const [loading, setLoading] = useState(true);

  const load = () => {
    api
      .get('/reminders')
      .then(({ data }) => setReminders(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      reminders.forEach((doc) => {
        doc.medicines?.forEach((med, mi) => {
          med.times?.forEach((t) => {
            const [h, m] = t.split(':').map(Number);
            const slot = new Date();
            slot.setHours(h, m, 0, 0);
            const diff = Math.abs(now - slot);
            if (diff < 15 * 60 * 1000 && Notification.permission === 'granted') {
              new Notification(`Time to take ${med.name}`, { body: med.dosage });
            }
          });
        });
      });
    }, 60 * 1000);
    return () => clearInterval(id);
  }, [reminders]);

  const todayMeds = useMemo(() => {
    const list = [];
    reminders.forEach((r) => {
      r.medicines?.forEach((med, mi) => {
        list.push({ docId: r._id, med, mi });
      });
    });
    return list;
  }, [reminders]);

  const markTaken = async (docId, medicineIndex) => {
    await api.patch(`/reminders/${docId}/taken`, { medicineIndex });
    load();
  };

  if (loading) return <div className="text-slate-500">Loading…</div>;

  const total = todayMeds.length;
  const taken = todayMeds.filter((x) =>
    x.med.takenLog?.some((l) => l.status === 'taken')
  ).length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-2 text-sm text-slate-500">Today progress</div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${total ? (taken / total) * 100 : 0}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-slate-600">
          {taken}/{total || 1} doses taken today
        </div>
      </div>

      <div className="dashboard-grid-3">
        {['Morning', 'Afternoon', 'Night'].map((col) => (
          <div key={col} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 font-semibold text-slate-800">{col}</div>
            <div className="space-y-3">
              {todayMeds.map(({ docId, med, mi }) => (
                <div
                  key={`${docId}-${mi}`}
                  className="rounded-xl border border-slate-100 p-3 text-sm"
                >
                  <div className="font-medium text-slate-800">{med.name}</div>
                  <div className="text-slate-500">{med.dosage}</div>
                  <div className="text-xs text-slate-400">{(med.times || []).join(', ')}</div>
                  <button
                    type="button"
                    onClick={() => markTaken(docId, mi)}
                    className="mt-2 rounded-lg bg-emerald-600 px-3 py-1 text-xs text-white"
                  >
                    Mark taken
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <input
        type="date"
        value={day.toISOString().slice(0, 10)}
        onChange={(e) => setDay(new Date(e.target.value))}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 sm:w-auto"
      />
    </div>
  );
}
