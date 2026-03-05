import ProtectedRoute from '@/lib/auth/ProtectedRoute';
import Sidebar from '@/components/sidebar'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar aria-label="Main Sidebar" />
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
