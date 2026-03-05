'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from './types';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  useEffect(() => {
    // Check for missing environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('CRITICAL: Supabase environment variables are missing! Login will not work.');
    }

    // Check active sessions and sets the user
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session) {
          setAuthState({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
              role: session.user.user_metadata?.role,
            },
            isAuthenticated: true,
            loading: false,
          });
        } else {
          setAuthState({ user: null, isAuthenticated: false, loading: false });
        }
      } catch (err) {
        console.error('Session retrieval error:', err);
        setAuthState({ user: null, isAuthenticated: false, loading: false });
      }
    };

    getSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setAuthState({
          user: {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
            role: session.user.user_metadata?.role,
          },
          isAuthenticated: true,
          loading: false,
        });
      } else if (event === 'SIGNED_OUT') {
        setAuthState({ user: null, isAuthenticated: false, loading: false });
      }
    });

    return () => subscription.unsubscribe();
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

  const signUp = async (email: string, password: string, name?: string) => {
    console.log('Attempting signUp for:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    });

    if (error) {
      console.error('SignUp error:', error.message, error);
      return { success: false, error: error.message };
    }
    console.log('SignUp successful:', data.user?.email);
    return { success: true };
  };

  const logout = async () => {
    console.log('Logging out');
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

