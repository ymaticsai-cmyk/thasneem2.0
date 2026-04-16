import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { getDoctorPatientId, setDoctorPatientId } from '../../lib/doctorPatient';
import { Alert, Button, Card, Input } from '../../components/ui';

export default function DoctorUpload() {
  const [selectedPatientId, setSelectedPatientId] = useState(() => getDoctorPatientId());
  const [patientLabel, setPatientLabel] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [file, setFile] = useState(null);
  const [recordId, setRecordId] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loadingPatient, setLoadingPatient] = useState(false);

  const syncFromScan = useCallback(() => {
    const id = getDoctorPatientId();
    setSelectedPatientId(id);
  }, []);

  useEffect(() => {
    syncFromScan();
  }, [syncFromScan]);

  useEffect(() => {
    if (!selectedPatientId) {
      setPatientLabel('');
      return;
    }
    let cancelled = false;
    setLoadingPatient(true);
    api
      .get(`/patients/${selectedPatientId}`)
      .then(({ data }) => {
        if (!cancelled) {
          setPatientLabel(`${data.name} · ${data.patientId}`);
        }
      })
      .catch((e) => {
        const d = e.response?.data;
        if (!cancelled) {
          if (d?.needsAccess) {
            setPatientLabel(`${d.name || 'Patient'} · ${d.patientId || ''} (access required)`);
          } else {
            setPatientLabel(selectedPatientId);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPatient(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPatientId]);

  const runSearch = async () => {
    if (!searchQ.trim()) return;
    try {
      const { data } = await api.get('/patients', { params: { q: searchQ.trim() } });
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    }
  };

  const pickPatient = (p) => {
    setDoctorPatientId(p._id);
    setSelectedPatientId(p._id);
    setSearchResults([]);
    setSearchQ('');
    setErr('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');

    const patientId = selectedPatientId || getDoctorPatientId();
    if (!patientId) {
      setErr('Select a patient using search below, or choose one from Scan / Search first.');
      return;
    }
    if (!file) {
      setErr('Choose a file: PDF, JPG, or PNG (max 10 MB).');
      return;
    }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('patientId', patientId);
    if (recordId.trim()) fd.append('recordId', recordId.trim());

    try {
      // Do not set Content-Type — axios sets multipart boundary automatically.
      await api.post('/uploads', fd);
      setMsg('File uploaded successfully.');
      setFile(null);
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <Card className="mx-auto max-w-xl">
      <form onSubmit={submit} className="space-y-4">
      <h2 className="font-display text-2xl font-semibold">Upload reports</h2>

      <div className="rounded-xl border border-border bg-surface-muted p-4 text-sm">
        <div className="font-medium text-text">Active patient</div>
        {loadingPatient && selectedPatientId ? (
          <p className="mt-1 text-text-muted">Loading…</p>
        ) : selectedPatientId ? (
          <p className="mt-1 text-text">{patientLabel || selectedPatientId}</p>
        ) : (
          <p className="mt-1 text-warning">No patient selected yet.</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={syncFromScan}
            tone="secondary"
            size="sm"
          >
            Sync from Scan / Search
          </Button>
          <Link
            to="/dashboard/doctor/scan"
            className="inline-flex h-9 items-center justify-center rounded-md border border-primary bg-primary-light px-3 text-xs font-medium text-primary"
          >
            Open Scan / Search
          </Link>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div className="text-sm font-medium text-text">Or pick a patient</div>
        <div className="mt-2 flex gap-2">
          <Input
            className="min-w-0 flex-1"
            placeholder="Search name or PAT-ID…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), runSearch())}
          />
          <Button
            type="button"
            onClick={runSearch}
            tone="secondary"
            className="shrink-0"
          >
            Search
          </Button>
        </div>
        {searchResults.length > 0 && (
          <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-border bg-surface text-sm">
            {searchResults.map((p) => (
              <li key={p._id}>
                <button
                  type="button"
                  onClick={() => pickPatient(p)}
                  className="w-full px-3 py-2 text-left text-text hover:bg-primary-light"
                >
                  {p.name} <span className="text-text-muted">{p.patientId}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-text">File</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setErr('');
          }}
          className="block w-full text-sm text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-bg"
        />
        {file && (
          <p className="mt-1 text-xs text-text-muted">
            Selected: {file.name} ({Math.round(file.size / 1024)} KB)
          </p>
        )}
      </div>

      <Input
        placeholder="Optional medical record ID (Mongo)"
        value={recordId}
        onChange={(e) => setRecordId(e.target.value)}
        className="w-full font-mono"
      />

      {err && <Alert tone="danger">{err}</Alert>}
      {msg && <Alert tone="success">{msg}</Alert>}

      <Button type="submit">
        Upload
      </Button>
      </form>
    </Card>
  );
}
