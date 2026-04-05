import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function ReceptionPatientList() {
  const [q, setQ] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get('/patients', { params: { q } })
        .then(({ data }) => setList(data))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <input
        placeholder="Search name, ID, blood group…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-4 w-full rounded-xl border border-slate-200 px-3 py-2"
      />
      {loading ? (
        <div className="text-slate-500">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">ID</th>
                <th className="px-2 py-2">Blood</th>
                <th className="px-2 py-2">Age</th>
                <th className="px-2 py-2">Registered</th>
                <th className="px-2 py-2">QR</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p._id} className="border-b border-slate-100">
                  <td className="px-2 py-2">
                    <Link
                      to={`/dashboard/receptionist/patients/${p._id}`}
                      className="text-primary hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-2 py-2">{p.patientId}</td>
                  <td className="px-2 py-2">{p.bloodGroup}</td>
                  <td className="px-2 py-2">{p.age}</td>
                  <td className="px-2 py-2">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-2 py-2">
                    {p.qrCodeUrl && (
                      <a
                        href={p.qrCodeUrl}
                        download
                        className="text-sm text-primary"
                      >
                        Reprint
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
