'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, ROLE_HOME } from '@/context/AuthContext';

/**
 * Root page — immediately redirects authenticated users to their role home.
 * The AppShell already guards unauthenticated users to /login.
 */
export default function RootPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(ROLE_HOME[user.role] || '/admin/war-room');
    }
  }, [isLoading, isAuthenticated, user, router]);

  return null;
}
