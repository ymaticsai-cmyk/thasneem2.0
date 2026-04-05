import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function PatientHistory() {
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [view, setView] = useState('timeline');
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: p } = await api.get('/patients/me');
        setPatient(p);
        const { data: r } = await api.get(`/records/${p._id}`);
        setRecords(r);
      } catch (e) {
        setErr(e.response?.data?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const downloadPdf = async () => {
    if (!patient) return;
    try {
      const { data } = await api.get(`/prescriptions/${patient._id}/pdf`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription-${patient.patientId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('No prescription PDF available');
    }
  };

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (err) return <div className="text-red-600">{err}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-600">View:</span>
        <button
          type="button"
          onClick={() => setView('timeline')}
          className={`rounded-lg px-3 py-1 text-sm ${view === 'timeline' ? 'bg-primary text-white' : 'bg-white'}`}
        >
          Timeline
        </button>
        <button
          type="button"
          onClick={() => setView('cards')}
          className={`rounded-lg px-3 py-1 text-sm ${view === 'cards' ? 'bg-primary text-white' : 'bg-white'}`}
        >
          Cards
        </button>
        <button
          type="button"
          onClick={downloadPdf}
          className="ml-auto rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm"
        >
          Download prescription PDF
        </button>
      </div>

      {view === 'timeline' ? (
        <div className="relative border-l-2 border-slate-200 pl-8">
          {records.map((r) => (
            <div key={r._id} className="relative mb-8">
              <div className="absolute -left-[25px] top-0 h-3 w-3 rounded-full bg-primary" />
              <div className="text-xs text-slate-500">{new Date(r.date).toLocaleString()}</div>
              <div className="mt-2 rounded-2xl bg-white p-4 shadow-sm">
                <div className="font-semibold text-slate-800">{r.diagnosis || 'Visit'}</div>
                <div className="text-sm text-slate-500">
                  Dr. {r.doctorId?.name || '—'}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      r.blockchainVerified
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {r.blockchainVerified ? 'Verified' : 'Tampered'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setModal(r)}
                    className="text-sm text-primary"
                  >
                    View details
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!records.length && <p className="text-slate-500">No records yet</p>}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {records.map((r) => (
            <div key={r._id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="text-xs text-slate-500">{new Date(r.date).toLocaleString()}</div>
              <div className="font-semibold text-slate-800">{r.diagnosis}</div>
              <span
                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${
                  r.blockchainVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                }`}
              >
                {r.blockchainVerified ? 'Verified' : 'Tampered'}
              </span>
              <button
                type="button"
                onClick={() => setModal(r)}
                className="mt-2 block text-sm text-primary"
              >
                View full details
              </button>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-bold text-slate-800">Record details</h3>
            <pre className="mt-4 whitespace-pre-wrap text-xs text-slate-600">
              {JSON.stringify(modal, null, 2)}
            </pre>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
