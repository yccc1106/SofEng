'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export type CurrentUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
};

type AuthState = {
  data: { user: CurrentUser } | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  refresh: () => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AuthState['data']>(null);
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const requestVersion = useRef(0);

  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    try {
      const response = await fetch('/java/users/profile', { cache: 'no-store' });
      if (!response.ok) throw new Error('Not authenticated');
      const result = await response.json();
      if (!result.success || !result.data?.id) throw new Error('Invalid profile');
      if (version === requestVersion.current) {
        setData({ user: result.data });
        setStatus('authenticated');
      }
      return true;
    } catch {
      if (version === requestVersion.current) {
        setData(null);
        setStatus('unauthenticated');
      }
      return false;
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const logout = useCallback(async () => {
    ++requestVersion.current;
    const response = await fetch('/java/auth/logout', { method: 'POST' });
    if (!response.ok && response.status !== 401) throw new Error('Logout failed');
    setData(null);
    setStatus('unauthenticated');
  }, []);

  return <AuthContext.Provider value={{ data, status, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth requires AuthProvider');
  return context;
}
