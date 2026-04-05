import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { getDoctorPatientId, setDoctorPatientId } from '../../lib/doctorPatient';

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
    <form onSubmit={submit} className="mx-auto max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-bold text-slate-800">Upload reports</h2>

      <div className="rounded-xl bg-slate-50 p-4 text-sm">
        <div className="font-medium text-slate-700">Active patient</div>
        {loadingPatient && selectedPatientId ? (
          <p className="mt-1 text-slate-500">Loading…</p>
        ) : selectedPatientId ? (
          <p className="mt-1 text-slate-800">{patientLabel || selectedPatientId}</p>
        ) : (
          <p className="mt-1 text-amber-800">No patient selected yet.</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={syncFromScan}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Sync from Scan / Search
          </button>
          <Link
            to="/dashboard/doctor/scan"
            className="rounded-lg border border-primary bg-primary-light px-3 py-1.5 text-xs font-medium text-primary"
          >
            Open Scan / Search
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <div className="text-sm font-medium text-slate-700">Or pick a patient</div>
        <div className="mt-2 flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Search name or PAT-ID…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), runSearch())}
          />
          <button
            type="button"
            onClick={runSearch}
            className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-800"
          >
            Search
          </button>
        </div>
        {searchResults.length > 0 && (
          <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white text-sm">
            {searchResults.map((p) => (
              <li key={p._id}>
                <button
                  type="button"
                  onClick={() => pickPatient(p)}
                  className="w-full px-3 py-2 text-left hover:bg-primary-light"
                >
                  {p.name} <span className="text-slate-500">{p.patientId}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">File</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setErr('');
          }}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
        />
        {file && (
          <p className="mt-1 text-xs text-slate-500">
            Selected: {file.name} ({Math.round(file.size / 1024)} KB)
          </p>
        )}
      </div>

      <input
        placeholder="Optional medical record ID (Mongo)"
        value={recordId}
        onChange={(e) => setRecordId(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm"
      />

      {err && <p className="text-sm text-red-600">{err}</p>}
      {msg && <p className="text-sm text-emerald-600">{msg}</p>}

      <button type="submit" className="rounded-xl bg-primary px-4 py-2.5 font-semibold text-white">
        Upload
      </button>
    </form>
  );
}
