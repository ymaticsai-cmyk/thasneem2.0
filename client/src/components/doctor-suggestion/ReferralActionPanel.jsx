import { Alert, Button, Card } from '../ui';

export default function ReferralActionPanel({
  selectedPatient,
  selectedDoctor,
  reason,
  onReasonChange,
  onCreateReferral,
  creating,
  error,
  success,
}) {
  const canSubmit = Boolean(selectedPatient && selectedDoctor) && !creating;

  return (
    <Card>
      <h3 className="mb-3 font-display text-lg font-semibold">4) Create referral</h3>
      <div className="mb-3 rounded-lg border border-border bg-surface-muted p-3 text-sm text-text">
        <p>
          <span className="font-medium">Patient:</span> {selectedPatient?.name || 'Not selected'}
        </p>
        <p>
          <span className="font-medium">Suggested doctor:</span>{' '}
          {selectedDoctor?.name || 'Not selected'}
        </p>
      </div>

      <textarea
        className="mb-3 min-h-24 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-soft focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        placeholder="Reason for referral (optional)"
        rows={3}
        value={reason}
        onChange={(e) => onReasonChange(e.target.value)}
      />
      {error && <Alert tone="danger" className="mb-2">{error}</Alert>}
      {success && <Alert tone="success" className="mb-2">{success}</Alert>}
      <Button type="button" onClick={onCreateReferral} disabled={!canSubmit}>
        {creating ? 'Creating referral...' : 'Create referral and grant access'}
      </Button>
    </Card>
  );
}
