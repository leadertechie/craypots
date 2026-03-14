import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { ADMIN_EMAIL } from '../constants';

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  loginAsAdmin: () => Promise<void>;
  loginAnonymously: () => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const isAdmin =
    !!user &&
    !user.isAnonymous &&
    user.email === ADMIN_EMAIL;

  async function loginAsAdmin() {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user.email !== ADMIN_EMAIL) {
      await signOut(auth);
      throw new Error('Access denied. Only the game admin can log in here.');
    }
  }

  async function loginAnonymously(): Promise<User> {
    const result = await signInAnonymously(auth);
    return result.user;
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, loginAsAdmin, loginAnonymously, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
