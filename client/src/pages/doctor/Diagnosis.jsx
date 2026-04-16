import { useState } from 'react';
import api from '../../services/api';
import { getDoctorPatientId } from '../../lib/doctorPatient';
import { Alert, Button, Card, Input } from '../../components/ui';

export default function DoctorDiagnosis() {
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
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
      const { data } = await api.post('/records', {
        patientId,
        diagnosis,
        symptoms: symptoms.split(',').map((s) => s.trim()).filter(Boolean),
        notes,
      });
      setMsg(
        data.blockInfo?.txHash
          ? 'Record saved and anchored on Ethereum (see patient records / integrity page).'
          : 'Record saved; integrity hash stored (add ETHEREUM_RPC_URL + ETHEREUM_PRIVATE_KEY to anchor on-chain).'
      );
      setSymptoms('');
      setDiagnosis('');
      setNotes('');
    } catch (e2) {
      const st = e2.response?.status;
      const msg = e2.response?.data?.message;
      setErr(
        st === 502
          ? msg || 'Ethereum anchoring failed — check wallet balance and RPC settings.'
          : msg || 'Failed'
      );
    }
  };

  return (
    <Card className="mx-auto max-w-xl">
      <form onSubmit={submit}>
        <h2 className="mb-2 font-display text-2xl font-semibold">Add diagnosis</h2>
        <p className="mb-4 text-sm text-text-muted">
        Patient: {getDoctorPatientId() || '— (use Scan first)'}
        </p>
        <Input
          placeholder="Symptoms (comma-separated)"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          className="mb-3"
        />
        <textarea
          placeholder="Diagnosis"
          required
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          className="mb-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-soft focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          rows={3}
        />
        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mb-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-soft focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          rows={2}
        />
        {err && <Alert tone="danger" className="mb-2">{err}</Alert>}
        {msg && <Alert tone="success" className="mb-2">{msg}</Alert>}
        <Button type="submit" className="mt-1">
          Save record
        </Button>
      </form>
    </Card>
  );
}
