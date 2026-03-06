'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './auth-context';

/** Show "taking too long" fallback after this many ms */
const LOADING_FALLBACK_MS = 8_000;

function AuthLoadingUI() {
  const [showFallback, setShowFallback] = useState(false);
  const { retrySession } = useAuth();

  useEffect(() => {
    const t = setTimeout(() => setShowFallback(true), LOADING_FALLBACK_MS);
    return () => clearTimeout(t);
  }, []);

  if (showFallback) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfdfd] gap-4 p-4">
        <p className="text-gray-600 text-center max-w-sm">
          Session check is taking longer than usual. This can happen with a slow connection.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => retrySession()}
            className="px-4 py-2 rounded-xl bg-[#0052CC] text-white font-medium text-sm hover:bg-[#0041a3] transition-colors"
          >
            Retry
          </button>
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfdfd]">
      <div className="animate-pulse text-[#0052CC] font-semibold">SyncBase loading...</div>
      <div className="mt-3 w-8 h-8 border-2 border-[#0052CC]/20 border-t-[#0052CC] rounded-full animate-spin" />
    </div>
  );
}

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) return <AuthLoadingUI />;
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
