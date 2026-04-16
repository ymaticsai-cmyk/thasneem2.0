import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { token, isAuthenticated, loading, refreshSession } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(true);
  const socketRef = useRef(null);

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !token || loading) return;
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/notifications', { params: { limit: 50 }, headers: authHeaders }),
        api.get('/notifications/unread-count', { headers: authHeaders }),
      ]);
      setNotifications(Array.isArray(listRes.data) ? listRes.data : []);
      setUnreadCount(countRes.data?.count ?? 0);
    } catch (e) {
      if (e?.response?.status === 401) {
        const ok = await refreshSession();
        if (ok) {
          try {
            const [listRes, countRes] = await Promise.all([
              api.get('/notifications', { params: { limit: 50 } }),
              api.get('/notifications/unread-count'),
            ]);
            setNotifications(Array.isArray(listRes.data) ? listRes.data : []);
            setUnreadCount(countRes.data?.count ?? 0);
          } catch {
            /* ignore */
          }
        }
      }
    }
  }, [isAuthenticated, token, loading, authHeaders, refreshSession]);

  useEffect(() => {
    if (loading || !isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    Promise.resolve().then(() => {
      refresh();
    });

    const socket = io({
      path: '/socket.io',
      auth: { token },
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('notification', (payload) => {
      if (!payload?.id) return;
      setNotifications((prev) => {
        if (prev.some((n) => n.id === payload.id)) return prev;
        return [payload, ...prev].slice(0, 100);
      });
      if (!payload.isRead) {
        setUnreadCount((c) => c + 1);
      }
    });

    socket.on('connect_error', () => {});
    socket.on('disconnect', () => {});

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [loading, isAuthenticated, token, refresh]);

  const refreshPushState = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushSupported(false);
      setPushEnabled(false);
      return;
    }
    setPushSupported(true);
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      const sub = await reg.pushManager.getSubscription();
      setPushEnabled(Boolean(sub));
    } catch {
      setPushEnabled(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated && token) {
      Promise.resolve().then(() => {
        refreshPushState();
      });
    } else {
      Promise.resolve().then(() => {
        setPushEnabled(false);
      });
    }
  }, [loading, isAuthenticated, token, refreshPushState]);

  const markAsRead = useCallback(
    async (id) => {
      let wasUnread = false;
      setNotifications((prev) => {
        const t = prev.find((n) => n.id === id);
        wasUnread = !!(t && !t.isRead);
        return prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      });
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await api.patch(`/notifications/${id}/read`, {}, { headers: authHeaders });
      } catch {
        refresh();
      }
    },
    [refresh, authHeaders]
  );

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await api.patch('/notifications/read-all', {}, { headers: authHeaders });
    } catch {
      refresh();
    }
  }, [refresh, authHeaders]);

  const deleteNotification = useCallback(
    async (id) => {
      let removedUnread = false;
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        removedUnread = !!(target && !target.isRead);
        return prev.filter((n) => n.id !== id);
      });
      if (removedUnread) setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await api.delete(`/notifications/${id}`, { headers: authHeaders });
      } catch {
        refresh();
      }
    },
    [authHeaders, refresh]
  );

  const subscribeEmergencyPush = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push not supported in this browser');
    }
    if (Notification.permission === 'denied') {
      throw new Error('Browser notification permission is blocked in site settings');
    }
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      throw new Error('Notification permission denied');
    }
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    const reg = await navigator.serviceWorker.ready;
    const { data } = await api.get('/notifications/push/vapid-public-key', { headers: authHeaders });
    const key = data?.publicKey;
    if (!key) throw new Error('Server push not configured');

    const converted = urlBase64ToUint8Array(key);
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: converted,
    });
    await api.post('/notifications/push/subscribe', sub.toJSON(), { headers: authHeaders });
    setPushEnabled(true);
  }, [authHeaders]);

  const disableEmergencyPush = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushEnabled(false);
      return;
    }
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
    }
    await api.post('/notifications/push/unsubscribe', {}, { headers: authHeaders });
    setPushEnabled(false);
  }, [authHeaders]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      panelOpen,
      setPanelOpen,
      refresh,
      markAsRead,
      markAllRead,
      deleteNotification,
      subscribeEmergencyPush,
      disableEmergencyPush,
      pushEnabled,
      pushSupported,
    }),
    [
      notifications,
      unreadCount,
      panelOpen,
      refresh,
      markAsRead,
      markAllRead,
      deleteNotification,
      subscribeEmergencyPush,
      disableEmergencyPush,
      pushEnabled,
      pushSupported,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
