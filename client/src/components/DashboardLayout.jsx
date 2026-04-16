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
    profile: 'Doctor Profile',
    scan: 'Scan / Search Patient',
    records: 'Medical Records',
    diagnosis: 'Add Diagnosis',
    prescription: 'Write Prescription',
    upload: 'Upload Reports',
    blockchain: 'On-chain integrity',
    appointments: 'Appointments',
    'all-patients': 'All Patients',
    patients: 'Patient Detail',
    suggestions: 'Doctor Suggestions',
  },
};

export default function DashboardLayout({ role }) {
  const { role: r } = useAuth();
  const effective = role || r;
  const basePath = `/dashboard/${effective}`;
  const location = useLocation();
  const segment = (location.pathname.replace(basePath, '').replace(/^\//, '') || '').split('/')[0];
  const titleMap = titles[effective] || {};
  const title = titleMap[segment] || 'Dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg text-text">
      <Sidebar
        role={effective}
        basePath={basePath}
        open={sidebarOpen}
        collapsed={collapsed}
        onClose={() => setSidebarOpen(false)}
      />
      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col transition-[padding] duration-[var(--duration-base)] ${
          collapsed ? 'lg:pl-[98px]' : 'lg:pl-[292px]'
        }`}
      >
        <Header
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          collapsed={collapsed}
        />
        <main className="futuristic-grid min-h-0 min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
