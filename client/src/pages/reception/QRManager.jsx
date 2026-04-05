import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function QRManager() {
  const [list, setList] = useState([]);

  useEffect(() => {
    api.get('/patients').then(({ data }) => setList(data));
  }, []);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-bold text-slate-800">QR codes</h2>
      <p className="mb-4 text-sm text-slate-500">
        Download or reprint patient QR codes. Same data as registration.
      </p>
      <ul className="space-y-4">
        {list.map((p) => (
          <li
            key={p._id}
            className="flex flex-wrap items-center gap-4 border-b border-slate-100 pb-4"
          >
            <div className="flex-1">
              <div className="font-medium text-slate-800">{p.name}</div>
              <div className="text-sm text-slate-500">{p.patientId}</div>
            </div>
            {p.qrCodeUrl && (
              <>
                <img src={p.qrCodeUrl} alt="" className="h-20 w-20 rounded-lg" />
                <a
                  href={p.qrCodeUrl}
                  download={`${p.patientId}.png`}
                  className="rounded-lg bg-primary px-3 py-2 text-sm text-white"
                >
                  Download
                </a>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
