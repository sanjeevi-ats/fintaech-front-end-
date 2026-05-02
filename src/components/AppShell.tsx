'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuth, ROLE_HOME } from '@/context/AuthContext';

// Routes that bypass the shell (no sidebar/topbar)
const BARE_ROUTES = ['/login', '/forgot-password'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const isBare = BARE_ROUTES.some(r => pathname.startsWith(r));

  // Client-side auth guard
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && !isBare) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
    if (isAuthenticated && user && isBare) {
      router.replace(ROLE_HOME[user.role] || '/');
    }
  }, [isAuthenticated, isLoading, isBare, pathname, router, user]);

  // Login page: render bare (no shell)
  if (isBare) {
    return <>{children}</>;
  }

  // Loading state while checking auth
  if (isLoading || !isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: 13, color: '#5a5a72' }}>Loading workspace...</div>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 240, display: 'flex', flexDirection: 'column', transition: 'margin-left 0.25s ease' }}>
        <TopBar />
        <main style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
