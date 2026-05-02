'use client';
import { useAuth } from '@/context/AuthContext';
import SuperAdminDashboard from '@/components/dashboards/SuperAdminDashboard';

export default function WarRoomPage() {
  const { user } = useAuth();
  return <SuperAdminDashboard />;
}
