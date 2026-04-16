import { Link } from 'react-router-dom';

export default function ReceptionOverview() {
  return (
    <div className="dashboard-grid-3">
      <Link
        to="/dashboard/receptionist/register"
        className="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md sm:p-6"
      >
        <div className="text-2xl">➕</div>
        <div className="mt-2 font-bold text-slate-800">Register patient</div>
        <p className="mt-1 text-sm text-slate-500">Fast intake form + QR</p>
      </Link>
      <Link
        to="/dashboard/receptionist/patients"
        className="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md sm:p-6"
      >
        <div className="text-2xl">🗂️</div>
        <div className="mt-2 font-bold text-slate-800">Patient list</div>
        <p className="mt-1 text-sm text-slate-500">Search and view</p>
      </Link>
      <Link
        to="/dashboard/receptionist/qr"
        className="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md sm:p-6"
      >
        <div className="text-2xl">📷</div>
        <div className="mt-2 font-bold text-slate-800">QR manager</div>
        <p className="mt-1 text-sm text-slate-500">Reprint codes</p>
      </Link>
    </div>
  );
}
