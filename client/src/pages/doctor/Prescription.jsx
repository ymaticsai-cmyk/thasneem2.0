import { useState } from 'react';
import api from '../../services/api';
import { getDoctorPatientId } from '../../lib/doctorPatient';
import { Alert, Button, Card, Input } from '../../components/ui';

export default function DoctorPrescription() {
  const [rows, setRows] = useState([
    { name: '', dosage: '', frequency: '', duration: '' },
  ]);
  const [notes, setNotes] = useState('');
  const [nextVisit, setNextVisit] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const patientId = getDoctorPatientId();
    if (!patientId) {
      setErr('Select patient from Scan / Search');
      return;
    }
    setErr('');
    try {
      const { data } = await api.post('/prescriptions', {
        patientId,
        medicines: rows.filter((r) => r.name),
        notes,
        nextVisit,
      });
      if (data.pdfBase64) {
        const blob = new Blob(
          [Uint8Array.from(atob(data.pdfBase64), (c) => c.charCodeAt(0))],
          { type: 'application/pdf' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'prescription.pdf';
        a.click();
        URL.revokeObjectURL(url);
      }
      setMsg('Prescription saved');
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Failed');
    }
  };

  return (
    <Card>
      <form onSubmit={submit}>
      <h2 className="mb-2 font-display text-2xl font-semibold">Prescription</h2>
      <p className="mb-4 text-sm text-text-muted">Patient: {getDoctorPatientId() || '—'}</p>
      {rows.map((row, i) => (
        <div key={i} className="mb-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <Input
            placeholder="Medicine"
            value={row.name}
            onChange={(e) => {
              const n = [...rows];
              n[i].name = e.target.value;
              setRows(n);
            }}
          />
          <Input
            placeholder="Dosage"
            value={row.dosage}
            onChange={(e) => {
              const n = [...rows];
              n[i].dosage = e.target.value;
              setRows(n);
            }}
          />
          <Input
            placeholder="Frequency"
            value={row.frequency}
            onChange={(e) => {
              const n = [...rows];
              n[i].frequency = e.target.value;
              setRows(n);
            }}
          />
          <Input
            placeholder="Duration"
            value={row.duration}
            onChange={(e) => {
              const n = [...rows];
              n[i].duration = e.target.value;
              setRows(n);
            }}
          />
        </div>
      ))}
      <Button
        type="button"
        onClick={() => setRows([...rows, { name: '', dosage: '', frequency: '', duration: '' }])}
        tone="ghost"
        size="sm"
        className="mb-4"
      >
        + Add row
      </Button>
      <textarea
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="mb-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-soft focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        rows={2}
      />
      <Input
        placeholder="Next visit"
        value={nextVisit}
        onChange={(e) => setNextVisit(e.target.value)}
        className="mb-4"
      />
      {err && <Alert tone="danger" className="mb-2">{err}</Alert>}
      {msg && <Alert tone="success" className="mb-2">{msg}</Alert>}
      <Button type="submit">
        Save & download PDF
      </Button>
      </form>
    </Card>
  );
}
