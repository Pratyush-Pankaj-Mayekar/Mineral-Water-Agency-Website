import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    const [customerResult, adminResult] = await Promise.allSettled([api.get('/auth/me'), api.get('/admin/auth/me')]);
    if (customerResult.status === 'fulfilled') {
      setUser(customerResult.value.data.user);
      setAdmin(null);
    } else if (adminResult.status === 'fulfilled') {
      setAdmin(adminResult.value.data.admin);
      setUser(null);
    } else {
      setUser(null);
      setAdmin(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refreshSession(); }, [refreshSession]);

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    setUser(data.user);
    setAdmin(null);
    return data.user;
  }, []);
  const register = useCallback(async (fields) => {
    const { data } = await api.post('/auth/register', fields);
    setUser(data.user);
    setAdmin(null);
    return data.user;
  }, []);
  const loginAdmin = useCallback(async (credentials) => {
    const { data } = await api.post('/admin/auth/login', credentials);
    setAdmin(data.admin);
    setUser(null);
    return data.admin;
  }, []);
  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } finally { setUser(null); setAdmin(null); }
  }, []);
  const updateProfile = useCallback(async (fields) => {
    const { data } = await api.put('/auth/profile', fields);
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(() => ({ user, admin, loading, login, register, loginAdmin, logout, updateProfile, refreshSession }), [user, admin, loading, login, register, loginAdmin, logout, updateProfile, refreshSession]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
