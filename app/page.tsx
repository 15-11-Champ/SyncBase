'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

export default function RootPage() {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const hasRedirectedRef = useRef(false);

    useEffect(() => {
        if (loading || hasRedirectedRef.current) return;
        hasRedirectedRef.current = true;
        if (isAuthenticated) {
            router.replace('/appointments/book');
        } else {
            router.replace('/login');
        }
    }, [isAuthenticated, loading, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="animate-pulse text-primary font-semibold">
                SyncBase loading...
            </div>
        </div>
    );
}
