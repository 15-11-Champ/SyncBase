'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface LoadingContextType {
    setIsLoading: (loading: boolean) => void;
    setMessage: (message: string) => void;
    isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('Processing...');
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Reset loading when pathname changes (page transition finished)
    useEffect(() => {
        setIsLoading(false);
    }, [pathname, searchParams]);

    // Handle global clicks for "automatic" loading feedback
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a');
            const button = target.closest('button');
            const manualLoading = target.closest('[data-loading="true"]');

            if (manualLoading) {
                setMessage('Processing...');
                setIsLoading(true);
                return;
            }

            // If it's a link to a different internal page
            if (anchor && anchor.href && anchor.target !== '_blank') {
                try {
                    const url = new URL(anchor.href);
                    if (url.origin === window.location.origin && url.pathname !== pathname) {
                        setMessage('Navigating...');
                        setIsLoading(true);
                    }
                } catch (e) {
                    // Ignore invalid URLs
                }
            }
        };

        const handleSubmit = () => {
            setMessage('Processing...');
            setIsLoading(true);
        };

        window.addEventListener('click', handleClick);
        window.addEventListener('submit', handleSubmit);
        return () => {
            window.removeEventListener('click', handleClick);
            window.removeEventListener('submit', handleSubmit);
        };
    }, [pathname]);

    return (
        <LoadingContext.Provider value={{ isLoading, setIsLoading, setMessage }}>
            {isLoading && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-2xl border border-border flex flex-col items-center gap-4 min-w-[200px] animate-in zoom-in-95 duration-300">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-lg font-semibold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent animate-pulse">
                            {message}
                        </p>
                    </div>
                </div>
            )}
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
}
