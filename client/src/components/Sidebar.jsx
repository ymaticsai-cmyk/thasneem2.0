import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  CalendarClock,
  Camera,
  ClipboardPlus,
  FileClock,
  FileText,
  Fingerprint,
  HeartPulse,
  Home,
  LogOut,
  Pill,
  ShieldCheck,
  Stethoscope,
  UserRoundCog,
  UserRoundSearch,
  Users,
} from 'lucide-react';
import { Badge, Button } from './ui';

const menus = {
  patient: [
    { to: '', label: 'Overview', icon: Home },
    { to: 'history', label: 'Medical History', icon: FileText },
    { to: 'reminders', label: 'Medicine Reminders', icon: Pill },
    { to: 'appointments', label: 'Appointments', icon: CalendarClock },
    { to: 'access', label: 'Access Control', icon: ShieldCheck },
    { to: 'activity', label: 'Activity Log', icon: Activity },
    { to: 'reports', label: 'Download Reports', icon: FileClock },
  ],
  receptionist: [
    { to: '', label: 'Overview', icon: Home },
    { to: 'register', label: 'Register Patient', icon: ClipboardPlus },
    { to: 'patients', label: 'Patient List', icon: Users },
    { to: 'qr', label: 'QR Manager', icon: Camera },
  ],
  nurse: [
    { to: '', label: 'Overview', icon: Home },
    { to: 'scan', label: 'Scan QR', icon: Camera },
    { to: 'vitals', label: 'Update Vitals', icon: HeartPulse },
    { to: 'patients', label: 'Patient List', icon: Users },
  ],
  doctor: [
    { to: '', label: 'Overview', icon: Home },
    { to: 'profile', label: 'My Profile', icon: UserRoundCog },
    { to: 'scan', label: 'Scan / Search', icon: UserRoundSearch },
    { to: 'records', label: 'Medical Records', icon: FileText },
    { to: 'diagnosis', label: 'Add Diagnosis', icon: ClipboardPlus },
    { to: 'prescription', label: 'Prescription', icon: Pill },
    { to: 'upload', label: 'Upload Reports', icon: FileClock },
    { to: 'blockchain', label: 'On-chain Integrity', icon: Fingerprint },
    { to: 'appointments', label: 'Appointments', icon: CalendarClock },
    { to: 'all-patients', label: 'All Patients', icon: Users },
    { to: 'suggestions', label: 'Suggestions', icon: Stethoscope },
  ],
};

export default function Sidebar({ role, basePath, open, onClose, collapsed }) {
  const { name, logout } = useAuth();
  const items = menus[role] || [];

  return (
    <>
      <div
        className={`fixed inset-0 z-[55] bg-black/35 transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`fixed inset-y-0 left-0 z-[65] flex w-[292px] flex-col border-r border-border bg-bg-elevated/95 backdrop-blur-xl transition-all duration-[var(--duration-base)] lg:fixed lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-[98px]' : 'lg:w-[292px]'}`}
      >
        <div className="border-b border-border px-4 py-5">
          <div className="flex items-center justify-between gap-2">
            <div className={collapsed ? 'hidden min-w-0' : 'block min-w-0'}>
              <div className="font-display text-lg font-semibold text-text">MediNexus</div>
              <div className="truncate text-xs text-text-soft">Clinical Intelligence Hub</div>
            </div>
            <Badge tone="info">v2</Badge>
          </div>
        </div>
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
          {items.map((item) => (
            <NavLink
              key={item.to || 'home'}
              to={item.to ? `${basePath}/${item.to}` : basePath}
              end={item.to === ''}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-[var(--duration-fast)] ${
                  isActive
                    ? 'bg-primary-light text-primary shadow-[var(--shadow-glow)]'
                    : 'text-text-muted hover:bg-surface-muted hover:text-text hover:shadow-[var(--shadow-soft)]'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={17} className="shrink-0" />
              <span className={collapsed ? 'hidden' : 'inline truncate'}>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <div className={`mb-3 truncate text-sm text-text ${collapsed ? 'hidden' : 'block'}`}>{name || 'User'}</div>
          <Button
            type="button"
            tone="ghost"
            className="w-full justify-start"
            onClick={() => {
              logout();
              onClose();
            }}
            title="Log out"
          >
            <LogOut size={16} />
            <span className={collapsed ? 'hidden' : 'inline'}>Log out</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
