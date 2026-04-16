import { useMemo } from 'react';
import { Fingerprint, ShieldCheck, UserRoundCog } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge, Card, StatCard } from '../../components/ui';

export default function DoctorProfile() {
  const { name, role, userId, sessionId } = useAuth();

  const statCards = useMemo(
    () => [
      { label: 'Role', value: role || 'doctor', icon: UserRoundCog, tone: 'info' },
      { label: 'User ID', value: userId || '0', icon: ShieldCheck, tone: 'success' },
      { label: 'Session', value: sessionId ? 1 : 0, icon: Fingerprint, tone: 'warning' },
    ],
    [role, userId, sessionId]
  );

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary-fade blur-2xl" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-text-muted">Identity and access</p>
            <h2 className="font-display text-3xl font-semibold">{name || 'Doctor Profile'}</h2>
            <p className="mt-1 text-sm text-text-soft">Credential and access posture for secure clinical operation.</p>
          </div>
          <Badge tone="success">Verified</Badge>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((item) => (
          <StatCard key={item.label} icon={item.icon} label={item.label} value={item.value} tone={item.tone} />
        ))}
      </div>
      <Card>
        <p className="text-sm text-text-muted">Session context</p>
        <p className="mt-2 text-sm text-text">
          {sessionId
            ? `Active secure session established. Session token starts with ${sessionId.slice(0, 10)}.`
            : 'Session context unavailable.'}
        </p>
      </Card>
    </div>
  );
}
