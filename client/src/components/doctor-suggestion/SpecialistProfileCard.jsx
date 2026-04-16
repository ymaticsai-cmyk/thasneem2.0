import { Alert, Card, Skeleton } from '../ui';

export default function SpecialistProfileCard({ profile, loading, error }) {
  return (
    <Card>
      <h3 className="mb-3 font-display text-lg font-semibold">3) Specialist profile</h3>
      {loading && (
        <div className="space-y-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      )}
      {error && <Alert tone="danger">{error}</Alert>}
      {!loading && !error && !profile && (
        <Alert tone="info">Select a specialist doctor to view profile details.</Alert>
      )}
      {!loading && !error && profile && (
        <dl className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface-muted p-3">
            <dt className="text-text-muted">Name</dt>
            <dd className="font-medium text-text">{profile.name}</dd>
          </div>
          <div className="rounded-lg border border-border bg-surface-muted p-3">
            <dt className="text-text-muted">Specialty</dt>
            <dd className="font-medium text-text">{profile.specialty || 'Not set'}</dd>
          </div>
          <div className="rounded-lg border border-border bg-surface-muted p-3">
            <dt className="text-text-muted">Registration no.</dt>
            <dd className="font-medium text-text">{profile.regNo || 'Not set'}</dd>
          </div>
          <div className="rounded-lg border border-border bg-surface-muted p-3">
            <dt className="text-text-muted">Email</dt>
            <dd className="font-medium text-text">{profile.email || 'Not set'}</dd>
          </div>
        </dl>
      )}
    </Card>
  );
}
