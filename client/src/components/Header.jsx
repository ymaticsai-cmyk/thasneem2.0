import { Bell, ChevronLeft, ChevronRight, Menu, Moon, Search, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { Avatar, Button } from './ui';
import NotificationPanel from './NotificationPanel';

export default function Header({ title, onMenuClick, onToggleCollapse, collapsed }) {
  const { name } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { unreadCount, panelOpen, setPanelOpen } = useNotifications();

  return (
    <header className="sticky top-0 z-[var(--z-header)] border-b border-border bg-bg-elevated/85 px-3 py-3 backdrop-blur-xl sm:px-4 lg:px-6">
      <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Button tone="ghost" size="sm" onClick={onMenuClick} className="lg:hidden" aria-label="Open menu">
          <Menu size={18} />
        </Button>
        <Button
          tone="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="hidden lg:inline-flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
          <h1 className="truncate font-display text-base font-semibold tracking-tight sm:text-lg">{title}</h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            tone="ghost"
            size="sm"
            aria-label="Notifications"
            className="relative"
            onClick={() => setPanelOpen(true)}
          >
            <Bell size={17} />
            {unreadCount > 0 ? (
              <span className="absolute right-1 top-1 flex min-h-[14px] min-w-[14px] items-center justify-center rounded-full bg-accent px-0.5 text-[10px] font-bold leading-none text-bg">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </Button>
          <NotificationPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
          <Button tone="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </Button>
          <Avatar name={name || 'User'} className="h-9 w-9 sm:h-10 sm:w-10" />
        </div>
      </div>
      <div className="mt-2 hidden min-w-0 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-text-muted lg:flex">
          <Search size={15} />
          <input
            type="search"
            placeholder="Search patient, appointment, doctor..."
            className="h-9 w-full min-w-0 max-w-[18rem] bg-transparent text-text placeholder:text-text-soft focus:outline-none"
            aria-label="Search dashboard"
          />
      </div>
    </header>
  );
}
