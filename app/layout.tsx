import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/auth-context';
import { TenantProvider } from '@/lib/tenant-context';
import { LoadingProvider } from '@/lib/loading-context';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Syncbase | CRM',
  description: 'Professional customer relationship management system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={null}>
          <AuthProvider>
            <TenantProvider>
              <LoadingProvider>
                {children}
              </LoadingProvider>
            </TenantProvider>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
