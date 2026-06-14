import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiFetch, tokenStore } from './api';

export type User = {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  provider: 'local' | 'google';
};

type Ctx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogleSession: (sessionId: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    try {
      const tok = await tokenStore.get();
      if (tok) {
        const me = await apiFetch<User>('/auth/me');
        setUser(me);
      }
    } catch {
      await tokenStore.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  const login = async (email: string, password: string) => {
    const data = await apiFetch<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      auth: false,
    });
    await tokenStore.set(data.access_token);
    setUser(data.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const data = await apiFetch<{ access_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
      auth: false,
    });
    await tokenStore.set(data.access_token);
    setUser(data.user);
  };

  const loginWithGoogleSession = async (sessionId: string) => {
    const data = await apiFetch<{ access_token: string; user: User }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
      auth: false,
    });
    await tokenStore.set(data.access_token);
    setUser(data.user);
  };

  const logout = async () => {
    await tokenStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogleSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
};
