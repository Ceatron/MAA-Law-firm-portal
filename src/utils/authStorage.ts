import { Advocate } from '../types';
import { loadStaffRoster } from './staffStorage';

const AUTH_STORAGE_KEY = 'muthoni_ahago_auth_session_v2';
const OLD_AUTH_KEYS = ['muthoni_ahago_auth_session_v1', 'muthoni_ahago_session'];

// Purge legacy sessions on script load so everyone is logged out cleanly
try {
  OLD_AUTH_KEYS.forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
} catch {
  // ignore storage errors
}

export interface AuthSession {
  isAuthenticated: boolean;
  advocate: Advocate;
  loginTime: string;
  rememberMe?: boolean;
}

export const getStoredAuthSession = (): AuthSession | null => {
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate advocate exists in staff roster
      if (parsed && parsed.isAuthenticated && parsed.advocate) {
        const staffRoster = loadStaffRoster();
        const matched = staffRoster.find((a) => a.id === parsed.advocate.id || a.email.toLowerCase() === parsed.advocate.email?.toLowerCase());
        if (matched) {
          return {
            isAuthenticated: true,
            advocate: matched,
            loginTime: parsed.loginTime || new Date().toISOString(),
            rememberMe: parsed.rememberMe,
          };
        }
      }
    }
  } catch (err) {
    console.error('Failed to read auth session:', err);
  }
  return null;
};

export const saveAuthSession = (advocate: Advocate, rememberMe = true): void => {
  try {
    const session: AuthSession = {
      isAuthenticated: true,
      advocate,
      loginTime: new Date().toISOString(),
      rememberMe,
    };
    if (rememberMe) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    }
    window.dispatchEvent(new CustomEvent('chambers-auth-changed', { detail: session }));
  } catch (err) {
    console.error('Failed to save auth session:', err);
  }
};

export const clearAuthSession = (): void => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    OLD_AUTH_KEYS.forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    window.dispatchEvent(
      new CustomEvent('chambers-auth-changed', { detail: { isAuthenticated: false } })
    );
  } catch (err) {
    console.error('Failed to clear auth session:', err);
  }
};
