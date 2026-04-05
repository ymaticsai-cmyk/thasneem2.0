import { useState } from 'react';
import api from '../../services/api';
import { getDoctorPatientId } from '../../lib/doctorPatient';

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
    <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-bold text-slate-800">Prescription</h2>
      <p className="mb-4 text-sm text-slate-500">Patient: {getDoctorPatientId() || '—'}</p>
      {rows.map((row, i) => (
        <div key={i} className="mb-3 grid gap-2 sm:grid-cols-4">
          <input
            placeholder="Medicine"
            value={row.name}
            onChange={(e) => {
              const n = [...rows];
              n[i].name = e.target.value;
              setRows(n);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
          <input
            placeholder="Dosage"
            value={row.dosage}
            onChange={(e) => {
              const n = [...rows];
              n[i].dosage = e.target.value;
              setRows(n);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
          <input
            placeholder="Frequency"
            value={row.frequency}
            onChange={(e) => {
              const n = [...rows];
              n[i].frequency = e.target.value;
              setRows(n);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
          <input
            placeholder="Duration"
            value={row.duration}
            onChange={(e) => {
              const n = [...rows];
              n[i].duration = e.target.value;
              setRows(n);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => setRows([...rows, { name: '', dosage: '', frequency: '', duration: '' }])}
        className="mb-4 text-sm text-primary"
      >
        + Add row
      </button>
      <textarea
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2"
        rows={2}
      />
      <input
        placeholder="Next visit"
        value={nextVisit}
        onChange={(e) => setNextVisit(e.target.value)}
        className="mb-4 w-full rounded-xl border border-slate-200 px-3 py-2"
      />
      {err && <p className="text-sm text-red-600">{err}</p>}
      {msg && <p className="text-sm text-emerald-600">{msg}</p>}
      <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-white">
        Save & download PDF
      </button>
    </form>
  );
}
