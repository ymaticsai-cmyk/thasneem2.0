import { useEffect, useState } from 'react';
import api from '../../services/api';
import { CalendarClock } from 'lucide-react';
import { Badge, Button, Card, DataTable, EmptyState, Input, StatCard } from '../../components/ui';

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

  const pendingRows = list.filter((a) => a.status === 'pending');
  const allRows = list.map((a) => ({
    id: a._id,
    date: new Date(a.date).toLocaleDateString(),
    time: a.time || '-',
    patient: a.patientId?.name || 'Patient',
    reason: a.reason || 'Not provided',
    status: a.status,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={CalendarClock} label="Total appointments" value={list.length} tone="info" />
        <StatCard icon={CalendarClock} label="Pending queue" value={pendingRows.length} tone="warning" />
        <StatCard
          icon={CalendarClock}
          label="Completed"
          value={list.filter((a) => a.status === 'completed').length}
          tone="success"
        />
      </div>

      <Card>
        <h2 className="mb-4 font-display text-xl font-semibold">Pending approvals</h2>
        <Input
          placeholder="Optional note for approve / reject"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mb-4"
        />
        {pendingRows.length ? (
          <ul className="space-y-3">
            {pendingRows.map((a) => (
              <li key={a._id} className="rounded-lg border border-border bg-surface-muted p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium text-text">{a.patientId?.name || 'Patient'}</div>
                    <div className="text-sm text-text-muted">
                      {new Date(a.date).toLocaleDateString()} {a.time || '-'} - {a.reason || 'No reason'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={() => act(a._id, 'approved')}>
                      Approve
                    </Button>
                    <Button type="button" tone="danger" size="sm" onClick={() => act(a._id, 'rejected')}>
                      Reject
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No pending appointments"
            description="All appointment requests are already triaged. New requests will appear here."
          />
        )}
      </Card>

      <Card>
        <h2 className="mb-4 font-display text-xl font-semibold">All appointments</h2>
        <DataTable
          columns={[
            { key: 'date', label: 'Date' },
            { key: 'time', label: 'Time' },
            { key: 'patient', label: 'Patient' },
            { key: 'reason', label: 'Reason' },
            {
              key: 'status',
              label: 'Status',
              render: (value) => (
                <Badge
                  tone={
                    value === 'approved'
                      ? 'info'
                      : value === 'completed'
                        ? 'success'
                        : value === 'rejected'
                          ? 'danger'
                          : 'warning'
                  }
                >
                  {value}
                </Badge>
              ),
            },
          ]}
          rows={allRows}
          emptyState="No appointments available."
        />
      </Card>
    </div>
  );
}
