import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import api, { setAuthToken, setAuthRefreshHandler } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'hhrm_auth';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(`${STORAGE_KEY}_access`) || '');
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem(`${STORAGE_KEY}_refresh`) || '');
  const [userId, setUserId] = useState(() => localStorage.getItem(`${STORAGE_KEY}_userId`) || '');
  const [role, setRole] = useState(() => localStorage.getItem(`${STORAGE_KEY}_role`) || '');
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(`${STORAGE_KEY}_session`) || '');
  const [name, setName] = useState(() => localStorage.getItem(`${STORAGE_KEY}_name`) || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthToken(token);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    setAuthRefreshHandler(async () => {
      const rt = localStorage.getItem(`${STORAGE_KEY}_refresh`);
      if (!rt) return null;
      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken: rt });
        const access = data.accessToken || data.token;
        const newRefresh = data.refreshToken;
        localStorage.setItem(`${STORAGE_KEY}_access`, access);
        if (newRefresh) localStorage.setItem(`${STORAGE_KEY}_refresh`, newRefresh);
        setToken(access);
        if (newRefresh) setRefreshToken(newRefresh);
        setAuthToken(access);
        return access;
      } catch {
        return null;
      }
    });
    return () => setAuthRefreshHandler(null);
  }, []);

  const login = (data) => {
    const access = data.accessToken || data.token;
    const refresh = data.refreshToken || '';
    setToken(access);
    setRefreshToken(refresh);
    setUserId(data.userId || '');
    setRole(data.role || '');
    setSessionId(data.sessionId || '');
    setName(data.name || '');
    localStorage.setItem(`${STORAGE_KEY}_access`, access);
    localStorage.setItem(`${STORAGE_KEY}_refresh`, refresh);
    localStorage.setItem(`${STORAGE_KEY}_userId`, data.userId || '');
    localStorage.setItem(`${STORAGE_KEY}_role`, data.role || '');
    localStorage.setItem(`${STORAGE_KEY}_session`, data.sessionId || '');
    localStorage.setItem(`${STORAGE_KEY}_name`, data.name || '');
    setAuthToken(access);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', { refreshToken: refreshToken || undefined });
    } catch {
      /* ignore */
    }
    setToken('');
    setRefreshToken('');
    setUserId('');
    setRole('');
    setSessionId('');
    setName('');
    localStorage.removeItem(`${STORAGE_KEY}_access`);
    localStorage.removeItem(`${STORAGE_KEY}_refresh`);
    localStorage.removeItem(`${STORAGE_KEY}_userId`);
    localStorage.removeItem(`${STORAGE_KEY}_role`);
    localStorage.removeItem(`${STORAGE_KEY}_session`);
    localStorage.removeItem(`${STORAGE_KEY}_name`);
    setAuthToken('');
  };

  const refreshSession = async () => {
    if (!refreshToken) return false;
    try {
      const { data } = await api.post('/auth/refresh', { refreshToken });
      login({ ...data, userId, role, sessionId, name });
      return true;
    } catch {
      await logout();
      return false;
    }
  };

  const value = useMemo(
    () => ({
      token,
      refreshToken,
      userId,
      role,
      sessionId,
      name,
      loading,
      login,
      logout,
      refreshSession,
      isAuthenticated: !!token,
    }),
    [token, refreshToken, userId, role, sessionId, name, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
