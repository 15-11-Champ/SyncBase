'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User, AuthState } from './types';
import { supabase } from '@/lib/supabaseClient';

/** Max wait for initial session check; prevents infinite loading if getSession hangs */
const SESSION_CHECK_TIMEOUT_MS = 10_000;

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name?: string, businessName?: string) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  logout: () => void;
  retrySession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface SessionUser {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}

function sessionToUser(session: { user: SessionUser }) {
  const u = session.user;
  return {
    id: u.id,
    email: u.email || '',
    name: (u.user_metadata?.full_name ?? u.user_metadata?.name) as string | undefined,
    role: u.user_metadata?.role as User['role'],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
  });
  const resolvedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applySessionResult = (session: { user: SessionUser } | null) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (session) {
      setAuthState({
        user: sessionToUser(session),
        isAuthenticated: true,
        loading: false,
      });
    } else {
      setAuthState({ user: null, isAuthenticated: false, loading: false });
    }
  };

  const checkSession = async () => {
    resolvedRef.current = false;
    setAuthState((prev) => ({ ...prev, loading: true }));

    timeoutRef.current = setTimeout(() => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      timeoutRef.current = null;
      console.warn('Auth: session check timed out after', SESSION_CHECK_TIMEOUT_MS, 'ms');
      setAuthState({ user: null, isAuthenticated: false, loading: false });
    }, SESSION_CHECK_TIMEOUT_MS);

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      applySessionResult(session);
    } catch (err) {
      console.error('Session retrieval error:', err);
      if (!resolvedRef.current) {
        resolvedRef.current = true;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setAuthState({ user: null, isAuthenticated: false, loading: false });
      }
    }
  };

  const retrySession = async () => {
    await checkSession();
  };

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('CRITICAL: Supabase environment variables are missing! Login will not work.');
    }

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        if (!resolvedRef.current && session) applySessionResult(session);
        return;
      }
      // Ignore auth events that don't change session (e.g. failed login can fire noise)
      if (session) {
        setAuthState({
          user: sessionToUser(session),
          isAuthenticated: true,
          loading: false,
        });
      } else if (event === 'SIGNED_OUT') {
        resolvedRef.current = false;
        setAuthState({ user: null, isAuthenticated: false, loading: false });
      }
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log('Attempting login for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error.message, error);
      return { success: false, error: error.message };
    }
    console.log('Login successful:', data.user?.email);
    return { success: true };
  };

  const signUp = async (email: string, password: string, name?: string, businessName?: string) => {
    console.log('Attempting signUp for:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          business_name: businessName,
        },
      },
    });

    if (error) {
      const isExistingUser = error.message?.toLowerCase().includes('already registered') || error.code === 'user_already_exists';
      const message = isExistingUser ? 'An account with this email already exists. Try signing in.' : error.message;
      console.error('SignUp error:', error.message, error);
      return { success: false, error: message };
    }
    const requiresEmailConfirmation = !!data.user && !data.session;
    if (requiresEmailConfirmation) {
      console.log('SignUp successful (email confirmation required):', data.user?.email);
    } else {
      console.log('SignUp successful:', data.user?.email);
    }
    return { success: true, requiresEmailConfirmation };
  };

  const logout = async () => {
    console.log('Logging out');
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, signUp, logout, retrySession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

