import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

const titles = {
  patient: {
    '': 'Overview',
    history: 'Medical History',
    reminders: 'Medicine Reminders',
    appointments: 'Appointments',
    access: 'Access Control',
    activity: 'Activity Log',
    reports: 'Download Reports',
  },
  receptionist: {
    '': 'Overview',
    register: 'Register Patient',
    patients: 'Patient List',
    qr: 'QR Manager',
  },
  nurse: {
    '': 'Overview',
    scan: 'Scan QR',
    vitals: 'Update Vitals',
    patients: 'Patient List',
  },
  doctor: {
    '': 'Overview',
    scan: 'Scan / Search Patient',
    records: 'Medical Records',
    diagnosis: 'Add Diagnosis',
    prescription: 'Write Prescription',
    upload: 'Upload Reports',
    blockchain: 'On-chain integrity',
    appointments: 'Appointments',
    'all-patients': 'All Patients',
  },
};

export default function DashboardLayout({ role }) {
  const { role: r } = useAuth();
  const effective = role || r;
  const basePath = `/dashboard/${effective}`;
  const location = useLocation();
  const segment = location.pathname.replace(basePath, '').replace(/^\//, '') || '';
  const titleMap = titles[effective] || {};
  const title = titleMap[segment] || 'Dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        role={effective}
        basePath={basePath}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
