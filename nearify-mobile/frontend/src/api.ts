import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';
export const API = `${BASE}/api`;

const TOKEN_KEY = 'nearify_jwt';

const storage = {
  async getItem(k: string) {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(k);
    return SecureStore.getItemAsync(k);
  },
  async setItem(k: string, v: string) {
    if (Platform.OS === 'web') { globalThis.localStorage?.setItem(k, v); return; }
    return SecureStore.setItemAsync(k, v);
  },
  async removeItem(k: string) {
    if (Platform.OS === 'web') { globalThis.localStorage?.removeItem(k); return; }
    return SecureStore.deleteItemAsync(k);
  },
};

export const tokenStore = {
  get: () => storage.getItem(TOKEN_KEY),
  set: (t: string) => storage.setItem(TOKEN_KEY, t),
  clear: () => storage.removeItem(TOKEN_KEY),
};

export async function apiFetch<T = any>(
  path: string,
  opts: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as any),
  };
  if (opts.auth !== false) {
    const token = await tokenStore.get();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = data?.detail || data?.message || `HTTP ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
}
