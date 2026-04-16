import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Activity, CalendarClock, Clock3, Sparkles, TrendingUp } from 'lucide-react';
import { Badge, Card, EmptyState, Skeleton, StatCard } from '../../components/ui';

export default function DoctorOverview() {
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadAppointments() {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get('/appointments');
        if (active) setAppts(Array.isArray(data) ? data : []);
      } catch (e) {
        if (active) setError(e.response?.data?.message || 'Unable to load dashboard metrics');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadAppointments();
    return () => {
      active = false;
    };
  }, []);

  const today = new Date().toDateString();
  const todayCount = appts.filter((a) => new Date(a.date).toDateString() === today).length;
  const pending = appts.filter((a) => a.status === 'pending').length;
  const done = appts.filter((a) => a.status === 'completed' || a.status === 'approved').length;
  const nextAppointment = appts.find((a) => new Date(a.date) >= new Date());
  const volumeByStatus = [
    { label: 'Pending', count: appts.filter((a) => a.status === 'pending').length, tone: 'warning' },
    { label: 'Approved', count: appts.filter((a) => a.status === 'approved').length, tone: 'info' },
    { label: 'Completed', count: appts.filter((a) => a.status === 'completed').length, tone: 'success' },
    { label: 'Rejected', count: appts.filter((a) => a.status === 'rejected').length, tone: 'danger' },
  ];

  if (loading) {
    return (
      <div className="dashboard-grid-3">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    );
  }

  if (error) {
    return <Card className="text-sm text-danger">{error}</Card>;
  }

  return (
    <div className="space-y-5">
      <Card className="relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-fade blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-text-muted">Doctor cockpit</p>
            <h2 className="font-display text-3xl font-semibold">Realtime clinical pulse</h2>
            <p className="mt-1 text-sm text-text-soft">High-density appointment intelligence with clear triage visibility.</p>
          </div>
          <Badge tone="info" className="gap-1">
            <Sparkles size={12} />
            Synced
          </Badge>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard icon={CalendarClock} label="Today&apos;s appointments" value={todayCount} tone="info" />
        <StatCard icon={Clock3} label="Pending approvals" value={pending} tone="warning" />
        <StatCard icon={Activity} label="Completed today" value={done} tone="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <p className="mb-4 flex items-center gap-2 text-sm text-text-muted">
            <TrendingUp size={16} />
            Appointment analytics
          </p>
          <div className="space-y-3">
            {volumeByStatus.map((item) => {
              const max = Math.max(...volumeByStatus.map((entry) => entry.count), 1);
              const width = `${(item.count / max) * 100}%`;
              const toneClass = {
                info: 'bg-info',
                warning: 'bg-warning',
                success: 'bg-success',
                danger: 'bg-danger',
              }[item.tone];
              return (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-xs text-text-muted">
                    <span>{item.label}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-muted">
                    <div className={`h-2 rounded-full ${toneClass}`} style={{ width }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        {nextAppointment ? (
          <Card>
            <p className="text-sm text-text-muted">Next queued appointment</p>
            <p className="mt-2 text-base font-semibold text-text">{nextAppointment.patientId?.name || 'Patient'}</p>
            <p className="mt-1 text-sm text-text-muted">{new Date(nextAppointment.date).toLocaleString()}</p>
            <p className="mt-4 rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs text-text-soft">
              {nextAppointment.reason || 'No reason provided'}
            </p>
          </Card>
        ) : (
          <EmptyState
            title="No queued appointments"
            description="Once a new patient booking is created, it will appear here with date, urgency and context."
          />
        )}
      </div>
    </div>
  );
}
