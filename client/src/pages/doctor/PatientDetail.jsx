import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import { Alert, Badge, Button, Card, EmptyState, Skeleton } from '../../components/ui';

export default function DoctorPatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadPatient() {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get(`/patients/${id}`);
        if (active) setPatient(data);
      } catch (e) {
        if (active) setError(e.response?.data?.message || 'Failed to load patient profile');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadPatient();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-36" />
        <Skeleton className="h-60" />
      </div>
    );
  }

  if (error) {
    return <Alert tone="danger">{error}</Alert>;
  }

  return (
    <div className="space-y-5">
      <Link to="/dashboard/doctor/all-patients">
        <Button tone="ghost" size="sm">
          Back to patients
        </Button>
      </Link>
      {patient ? (
        <Card>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-text-muted">Patient detail view</p>
              <h2 className="font-display text-3xl font-semibold">{patient?.name}</h2>
              <p className="mt-1 text-sm text-text-soft">Readability-first clinical profile with emergency-critical context.</p>
            </div>
            <Badge tone="info">{patient?.patientId}</Badge>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface-muted p-3">
              <dt className="text-text-muted">Age / Gender</dt>
              <dd className="mt-1 text-text">
                {patient?.age} / {patient?.gender || 'N/A'}
              </dd>
            </div>
            <div className="rounded-lg border border-border bg-surface-muted p-3">
              <dt className="text-text-muted">Blood Group</dt>
              <dd className="mt-1 text-text">{patient?.bloodGroup || 'N/A'}</dd>
            </div>
            <div className="rounded-lg border border-border bg-surface-muted p-3">
              <dt className="text-text-muted">Allergies</dt>
              <dd className="mt-1 text-text">{(patient?.allergies || []).join(', ') || 'None listed'}</dd>
            </div>
            <div className="rounded-lg border border-border bg-surface-muted p-3">
              <dt className="text-text-muted">Chronic Conditions</dt>
              <dd className="mt-1 text-text">{(patient?.chronicDiseases || []).join(', ') || 'None listed'}</dd>
            </div>
            <div className="rounded-lg border border-border bg-surface-muted p-3 sm:col-span-2">
              <dt className="text-text-muted">Emergency Contact</dt>
              <dd className="mt-1 text-text">
                {patient?.emergencyContact?.name || 'N/A'} - {patient?.emergencyContact?.phone || 'N/A'} (
                {patient?.emergencyContact?.relation || 'N/A'})
              </dd>
            </div>
          </dl>
        </Card>
      ) : (
        <EmptyState
          title="Patient record unavailable"
          description="This profile could not be resolved from the current route context."
        />
      )}
    </div>
  );
}
