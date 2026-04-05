import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menus = {
  patient: [
    { to: '', label: 'Overview', icon: '🏠' },
    { to: 'history', label: 'Medical History', icon: '📄' },
    { to: 'reminders', label: 'Medicine Reminders', icon: '💊' },
    { to: 'appointments', label: 'Appointments', icon: '📅' },
    { to: 'access', label: 'Access Control', icon: '🔐' },
    { to: 'activity', label: 'Activity Log', icon: '📊' },
    { to: 'reports', label: 'Download Reports', icon: '📥' },
  ],
  receptionist: [
    { to: '', label: 'Overview', icon: '🏠' },
    { to: 'register', label: 'Register Patient', icon: '➕' },
    { to: 'patients', label: 'Patient List', icon: '🗂️' },
    { to: 'qr', label: 'QR Manager', icon: '📷' },
  ],
  nurse: [
    { to: '', label: 'Overview', icon: '🏠' },
    { to: 'scan', label: 'Scan QR', icon: '📷' },
    { to: 'vitals', label: 'Update Vitals', icon: '❤️' },
    { to: 'patients', label: 'Patient List', icon: '📋' },
  ],
  doctor: [
    { to: '', label: 'Overview', icon: '🏠' },
    { to: 'scan', label: 'Scan / Search', icon: '📷' },
    { to: 'records', label: 'Medical Records', icon: '📄' },
    { to: 'diagnosis', label: 'Add Diagnosis', icon: '✍️' },
    { to: 'prescription', label: 'Prescription', icon: '💊' },
    { to: 'upload', label: 'Upload Reports', icon: '📤' },
    { to: 'blockchain', label: 'On-chain integrity', icon: '⛓' },
    { to: 'appointments', label: 'Appointments', icon: '📅' },
    { to: 'all-patients', label: 'All Patients', icon: '👥' },
  ],
};

export default function Sidebar({ role, basePath, open, onClose }) {
  const { name, logout } = useAuth();
  const items = menus[role] || [];

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-slate-200 px-4 py-5">
          <div className="text-lg font-bold text-primary">🏥 City Health</div>
          <div className="text-xs text-slate-500">Hospital Records</div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {items.map((item) => (
            <NavLink
              key={item.to || 'home'}
              to={item.to ? `${basePath}/${item.to}` : basePath}
              end={item.to === ''}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-light text-primary'
                    : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <div className="mb-2 truncate text-sm font-medium text-slate-800">{name || 'User'}</div>
          <button
            type="button"
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full rounded-lg border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
