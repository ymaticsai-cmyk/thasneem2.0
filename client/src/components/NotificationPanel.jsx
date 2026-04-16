import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { Button } from './ui';

export default function NotificationPanel({ open, onClose }) {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllRead,
    deleteNotification,
    subscribeEmergencyPush,
    disableEmergencyPush,
    pushEnabled,
    pushSupported,
  } = useNotifications();
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState('');

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[9998] bg-black/55 backdrop-blur-sm"
        aria-label="Close notifications"
        onClick={onClose}
      />
      <aside
        className="fixed right-0 top-0 z-[9999] flex h-[100dvh] w-full max-w-md flex-col border-l border-border bg-bg-elevated shadow-2xl"
        role="dialog"
        aria-label="Notifications"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Bell size={18} className="text-accent" />
            <span className="truncate font-display font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {unreadCount > 0 && (
              <Button tone="ghost" size="sm" onClick={() => markAllRead()} aria-label="Mark all read">
                <CheckCheck size={16} />
                <span className="ml-1 hidden sm:inline">Read all</span>
              </Button>
            )}
            <Button tone="ghost" size="sm" onClick={onClose} aria-label="Close">
              <X size={18} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 sm:px-3">
          {notifications.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-text-muted">No notifications yet.</p>
          ) : (
            <ul className="space-y-1">
              {notifications.map((n) => (
                <li key={n.id}>
                  <div
                    className={`w-full rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-surface/80 ${
                      !n.isRead ? 'bg-accent/5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => {
                          markAsRead(n.id);
                          if (n.routeLink) {
                            navigate(n.routeLink);
                            onClose();
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="break-words text-sm font-medium text-text">{n.title}</span>
                          {!n.isRead && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />
                          )}
                        </div>
                        {n.body ? <p className="mt-1 text-xs text-text-muted">{n.body}</p> : null}
                        {n.priority === 'emergency' && (
                          <span className="mt-2 inline-block rounded bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-400">
                            Emergency
                          </span>
                        )}
                      </button>
                      <Button
                        tone="ghost"
                        size="sm"
                        className="h-8 w-8 shrink-0 p-0 text-text-soft hover:text-danger"
                        aria-label="Delete notification"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(n.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
          <p className="mb-2 text-xs text-text-muted">
            Browser alerts for emergency events only (requires permission).
          </p>
          <Button
            tone="secondary"
            size="sm"
            className="w-full"
            disabled={pushBusy || !pushSupported}
            onClick={async () => {
              setPushError('');
              setPushBusy(true);
              try {
                if (pushEnabled) {
                  await disableEmergencyPush();
                } else {
                  await subscribeEmergencyPush();
                }
              } catch (e) {
                setPushError(e?.message || (pushEnabled ? 'Could not disable push' : 'Could not enable push'));
              } finally {
                setPushBusy(false);
              }
            }}
          >
            {pushBusy ? (pushEnabled ? 'Disabling…' : 'Enabling…') : pushEnabled ? 'Disable emergency browser alerts' : 'Enable emergency browser alerts'}
          </Button>
          {!pushSupported ? (
            <p className="mt-2 text-xs text-text-soft">This browser does not support push notifications.</p>
          ) : null}
          {pushError ? <p className="mt-2 text-xs text-red-400">{pushError}</p> : null}
        </div>
      </aside>
    </>,
    document.body
  );
}
