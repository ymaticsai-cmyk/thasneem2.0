import { useState } from 'react';
import api from '../../services/api';

export default function PatientReports() {
  const [msg, setMsg] = useState('');

  const download = async () => {
    try {
      const { data: p } = await api.get('/patients/me');
      const { data } = await api.get(`/prescriptions/${p._id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reports-${p.patientId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg('Download started');
    } catch {
      setMsg('Could not download — prescription PDF may be missing');
    }
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <h2 className="mb-4 font-bold text-slate-800">Download reports</h2>
      <p className="mb-4 text-sm text-slate-600">
        Export your latest prescription as PDF (same as medical history download).
      </p>
      <button
        type="button"
        onClick={download}
        className="rounded-xl bg-primary px-4 py-2 font-semibold text-white"
      >
        Download PDF
      </button>
      {msg && <p className="mt-3 text-sm text-slate-600">{msg}</p>}
    </div>
  );
}
