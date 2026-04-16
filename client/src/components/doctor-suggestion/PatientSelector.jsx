import { Alert, Card, Input, PatientCard, Skeleton } from '../ui';

export default function PatientSelector({
  q,
  onSearchChange,
  patients,
  loading,
  error,
  selectedPatientId,
  onSelectPatient,
}) {
  return (
    <Card>
      <h3 className="mb-3 font-display text-lg font-semibold">1) Select patient</h3>
      <Input
        className="mb-3"
        placeholder="Search patient by name, patient ID, blood group"
        value={q}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      {loading && (
        <div className="space-y-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      )}
      {error && <Alert tone="danger">{error}</Alert>}
      {!loading && !error && patients.length === 0 && (
        <Alert tone="warning">No patients found for the current search.</Alert>
      )}

      <ul className="space-y-2">
        {patients.map((patient) => (
          <li key={patient._id}>
            <PatientCard
              name={patient.name}
              subtitle={patient.patientId}
              selected={selectedPatientId === patient._id}
              onClick={() => onSelectPatient(patient)}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}
