'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  // ⛔ NEVER redirect during render
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  // ⏳ Prevent render mismatch
  if (loading) return null;

  // If not authenticated, do not render protected pages
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
