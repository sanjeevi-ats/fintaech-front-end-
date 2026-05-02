'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/authService';

// ─── Types ───────────────────────────────────────────────────
export type UserRole =
  | 'super_admin' | 'partner' | 'branch_manager'
  | 'accountant' | 'collection_officer' | 'recovery_specialist' | 'loan_officer' | 'agent' | 'customer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branch?: string;
  branchId?: string;
  avatar: string;
  mfaRequired: boolean;
  token: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginError: string | null;
  failedAttempts: number;
  isLocked: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<{ success: boolean; requiresMFA: boolean }>;
  verifyMFA: (code: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

// ─── Role → Route mapping ────────────────────────────────────
export const ROLE_HOME: Record<UserRole, string> = {
  super_admin:        '/admin/war-room',
  partner:            '/investor/dashboard',
  branch_manager:     '/branch/daily-ops',
  collection_officer: '/mobile/collection-sheet',
  accountant:         '/finance/ledger',
  recovery_specialist:'/collections',
  loan_officer:       '/loans/applications',
  agent:              '/loans/applications',
  customer:           '/customer/dashboard',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin:        'Super Admin',
  partner:            'Partner / Investor',
  branch_manager:     'Branch Manager',
  collection_officer: 'Collection Officer',
  accountant:         'Accountant',
  recovery_specialist:'Recovery Specialist',
  loan_officer:       'Loan Officer',
  agent:              'Agent',
  customer:           'Customer',
};

// ─── Storage helpers ─────────────────────────────────────────
const SESSION_KEY = 'annaitech_session';
const LOCK_KEY = 'annaitech_lockout';
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function saveSession(user: AuthUser, rememberMe: boolean) {
  const payload = JSON.stringify({ user, ts: Date.now() });
  if (typeof window !== 'undefined') {
    if (rememberMe) {
      localStorage.setItem(SESSION_KEY, payload);
    } else {
      sessionStorage.setItem(SESSION_KEY, payload);
    }
    document.cookie = `${SESSION_KEY}=${encodeURIComponent(payload)}; path=/; max-age=${rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60}; samesite=lax`;
  }
}

function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { user, ts } = JSON.parse(raw);
    
    // Simple JWT payload parser (part 2)
    const tokenParts = user.token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
      // JWT exp is in seconds, Date.now() is in ms
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        clearSession();
        return null;
      }
    } else {
      // Fallback for demo tokens (legacy support)
      const decoded = JSON.parse(atob(user.token));
      if (decoded.exp < Date.now()) { clearSession(); return null; }
    }
    
    return user;
  } catch { return null; }
}

function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    document.cookie = `${SESSION_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    // Clear any branch-cached data
    const keys = Object.keys(localStorage).filter(k => k.startsWith('branch_'));
    keys.forEach(k => localStorage.removeItem(k));
  }
}

function getLockState(): { locked: boolean; lockedUntil: number; attempts: number } {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    if (!raw) return { locked: false, lockedUntil: 0, attempts: 0 };
    return JSON.parse(raw);
  } catch { return { locked: false, lockedUntil: 0, attempts: 0 }; }
}

function setLockState(attempts: number) {
  const locked = attempts >= MAX_ATTEMPTS;
  const lockedUntil = locked ? Date.now() + LOCK_DURATION_MS : 0;
  localStorage.setItem(LOCK_KEY, JSON.stringify({ locked, lockedUntil, attempts }));
}

function clearLockState() { localStorage.removeItem(LOCK_KEY); }

// ─── Context ─────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pendingMFAUser, setPendingMFAUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // Restore session on mount
  useEffect(() => {
    const lock = getLockState();
    if (lock.locked && lock.lockedUntil > Date.now()) {
      setIsLocked(true);
      setFailedAttempts(lock.attempts);
    } else if (lock.locked) {
      clearLockState(); // Lock expired
    }

    const saved = loadSession();
    if (saved) setUser(saved);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (
    email: string, password: string, rememberMe: boolean
  ): Promise<{ success: boolean; requiresMFA: boolean }> => {
    const lock = getLockState();
    if (lock.locked && lock.lockedUntil > Date.now()) {
      setIsLocked(true);
      setLoginError(`Account locked. Try again in ${Math.ceil((lock.lockedUntil - Date.now()) / 60000)} minutes.`);
      return { success: false, requiresMFA: false };
    }

    setIsLoading(true);
    setLoginError(null);

    try {
      const response = await authService.login({ email, password });
      
      clearLockState();
      setFailedAttempts(0);

      // Store token in localStorage for API client
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.token);
      }

      const safeUser: AuthUser = {
        id: response.email, // Use email as ID for now
        name: response.name,
        email: response.email,
        role: response.role.toLowerCase() as UserRole,
        avatar: response.name.split(' ').map((n: string) => n[0]).join(''),
        mfaRequired: false, // Default to false unless API says otherwise
        token: response.token,
      };

      saveSession(safeUser, rememberMe);
      setUser(safeUser);
      setIsLoading(false);
      return { success: true, requiresMFA: false };

    } catch (err: any) {
      const newAttempts = (lock.attempts || 0) + 1;
      setFailedAttempts(newAttempts);
      setLockState(newAttempts);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        setLoginError('Account locked after 5 failed attempts. Try again in 15 minutes.');
      } else {
        setLoginError(err.message || 'Connection error. Please try again.');
      }
      
      setIsLoading(false);
      return { success: false, requiresMFA: false };
    }
  }, []);

  const verifyMFA = useCallback(async (code: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 700));
    // Accept any 6-digit code for demo
    if (/^\d{6}$/.test(code) && pendingMFAUser) {
      saveSession(pendingMFAUser, true);
      setUser(pendingMFAUser);
      setPendingMFAUser(null);
      setIsLoading(false);
      return true;
    }
    setLoginError('Invalid OTP code. Please try again.');
    setIsLoading(false);
    return false;
  }, [pendingMFAUser]);

  const logout = useCallback(() => {
    clearSession();
    // Clear token from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setUser(null);
    setPendingMFAUser(null);
    setLoginError(null);
  }, []);

  const clearError = useCallback(() => setLoginError(null), []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, loginError, failedAttempts, isLocked, login, verifyMFA, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }

// Legacy demo users export for TopBar role switcher
const DEMO_USERS = [
  { id: '1', name: 'Super Admin', email: 'super_admin@finveda.com', role: 'super_admin' as UserRole, avatar: 'SA' },
  { id: '2', name: 'Partner', email: 'partner@finveda.com', role: 'partner' as UserRole, avatar: 'P' },
  { id: '3', name: 'Branch Manager', email: 'manager@finveda.com', role: 'branch_manager' as UserRole, avatar: 'BM' },
  { id: '4', name: 'Collection Officer', email: 'officer@finveda.com', role: 'collection_officer' as UserRole, avatar: 'CO' },
  { id: '5', name: 'Accountant', email: 'accountant@finveda.com', role: 'accountant' as UserRole, avatar: 'A' },
  { id: '6', name: 'Recovery Specialist', email: 'recovery@finveda.com', role: 'recovery_specialist' as UserRole, avatar: 'RS' },
  { id: '7', name: 'Loan Officer', email: 'loan@finveda.com', role: 'loan_officer' as UserRole, avatar: 'LO' },
  { id: '8', name: 'Agent', email: 'agent@finveda.com', role: 'agent' as UserRole, avatar: 'AG' },
  { id: '9', name: 'Customer', email: 'customer@finveda.com', role: 'customer' as UserRole, avatar: 'C' }
];

export const demoUsers = DEMO_USERS;
