'use client';
import { useAuth } from '@/context/AuthContext';
import SuperAdminDashboard from '@/components/dashboards/SuperAdminDashboard';
import BranchManagerDashboard from '@/components/dashboards/BranchManagerDashboard';
import CollectionDashboard from '@/components/dashboards/CollectionDashboard';
import PartnerDashboard from '@/components/dashboards/PartnerDashboard';
import AccountantDashboard from '@/components/dashboards/AccountantDashboard';

/**
 * Main Dashboard - Routes to role-specific dashboard
 */
export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  // Show loading while user is loading
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Loading Dashboard...</div>
          <div style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
        </div>
      </div>
    );
  }

  // Show loading if user not available
  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Loading...</div>
        </div>
      </div>
    );
  }

  // Select dashboard based on role
  switch (user.role) {
    case 'super_admin':
      return <SuperAdminDashboard />;
    case 'branch_manager':
      return <BranchManagerDashboard />;
    case 'collection_officer':
    case 'recovery_specialist':
      return <CollectionDashboard />;
    case 'partner':
      return <PartnerDashboard />;
    case 'accountant':
      return <AccountantDashboard />;
    case 'loan_officer':
    case 'agent':
      // Use SuperAdminDashboard as fallback for agents
      return <SuperAdminDashboard />;
    default:
      return <SuperAdminDashboard />;
  }
}
