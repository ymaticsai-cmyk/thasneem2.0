import { Link } from 'react-router-dom';

export default function NurseOverview() {
  return (
    <div className="dashboard-grid-3">
      <Link to="/dashboard/nurse/scan" className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="text-2xl">📷</div>
        <div className="mt-2 font-bold">Scan QR</div>
      </Link>
      <Link to="/dashboard/nurse/vitals" className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="text-2xl">❤️</div>
        <div className="mt-2 font-bold">Update vitals</div>
      </Link>
      <Link to="/dashboard/nurse/patients" className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="text-2xl">📋</div>
        <div className="mt-2 font-bold">Patients</div>
      </Link>
    </div>
  );
}
