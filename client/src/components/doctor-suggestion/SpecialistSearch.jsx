import { Alert, Card, DoctorChip, Input, Skeleton } from '../ui';

export default function SpecialistSearch({
  q,
  onSearchChange,
  doctors,
  loading,
  error,
  selectedDoctorId,
  onSelectDoctor,
}) {
  return (
    <Card>
      <h3 className="mb-3 font-display text-lg font-semibold">2) Suggest specialist</h3>
      <Input
        className="mb-3"
        placeholder="Search specialist by name or specialty"
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
      {!loading && !error && doctors.length === 0 && (
        <Alert tone="warning">No doctors found for this search.</Alert>
      )}

      <ul className="space-y-2">
        {doctors.map((doctor) => (
          <li key={doctor._id}>
            <DoctorChip
              name={doctor.name}
              specialty={doctor.specialty}
              selected={selectedDoctorId === doctor._id}
              onClick={() => onSelectDoctor(doctor)}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}
