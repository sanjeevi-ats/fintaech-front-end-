'use client';
import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Clock, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';

interface ModuleStatus {
  name: string;
  path: string;
  status: 'working' | 'issues' | 'not-tested';
  description: string;
  issues: string[];
  fixes: string[];
}

export default function IntegrationStatusPage() {
  const [modules, setModules] = useState<ModuleStatus[]>([
    {
      name: 'Loans Portfolio',
      path: '/loans',
      status: 'working',
      description: 'Main loan management page with portfolio overview',
      issues: [],
      fixes: ['✓ New Application button now navigates to /loans/applications', '✓ View button opens loan detail modal', '✓ Real-time data from API']
    },
    {
      name: 'Loan Applications',
      path: '/loans/applications',
      status: 'working',
      description: 'Create and manage loan applications',
      issues: [],
      fixes: ['✓ New application form integrated with backend', '✓ Approval and disbursement workflows', '✓ Real customer and loan data']
    },
    {
      name: 'Daily Collections',
      path: '/collections',
      status: 'issues',
      description: 'Daily collection sheet for field agents',
      issues: ['Redis connection errors may occur', 'Some loan details may not load if backend is incomplete'],
      fixes: ['✓ Added fallback endpoints for Redis issues', '✓ Enhanced error handling', '✓ Collection recording integrated']
    },
    {
      name: 'Collection Entry Sheet',
      path: '/collection-entry',
      status: 'working',
      description: 'Advanced collection entry with search and installment tracking',
      issues: [],
      fixes: ['✓ Customer/Loan ID search functionality', '✓ Installment details display (Total/Completed/Pending)', '✓ Last paid installment tracking', '✓ Collection form with validation', '✓ Role-based access (Admin/Agent)', '✓ Date validation (no future dates)', '✓ Real-time data refresh after submission']
    },
    {
      name: 'General Ledger',
      path: '/ledger',
      status: 'issues',
      description: 'Double-entry accounting ledger system',
      issues: ['404 errors on some accounting endpoints', 'P&L data may not load'],
      fixes: ['✓ Added alternative endpoint fallbacks', '✓ Enhanced error handling', '✓ Trial balance integration']
    },
    {
      name: 'Day-End Closing',
      path: '/accounting/dayend',
      status: 'issues',
      description: 'Daily cash reconciliation and closing',
      issues: ['Cash balance loading may fail', 'Day-end API endpoints may vary'],
      fixes: ['✓ Multiple cash account detection', '✓ Alternative endpoint support', '✓ Better error messages']
    },
    {
      name: 'Address Book (CRM)',
      path: '/addressbook',
      status: 'working',
      description: 'Customer, agent, and guarantor directory',
      issues: [],
      fixes: ['✓ Real customer data integration', '✓ User/agent listing', '✓ Search functionality']
    },
    {
      name: 'API Integration',
      path: '/test-api',
      status: 'not-tested',
      description: 'Comprehensive API endpoint testing',
      issues: ['Run tests to identify specific issues'],
      fixes: ['✓ Created comprehensive test suite', '✓ Redis error detection', '✓ Alternative endpoint testing']
    }
  ]);

  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177'}/api/v1/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      setBackendStatus(response.ok ? 'online' : 'offline');
    } catch {
      setBackendStatus('offline');
    }
  };

  const getStatusIcon = (status: ModuleStatus['status']) => {
    switch (status) {
      case 'working':
        return <CheckCircle2 size={16} color="#10b981" />;
      case 'issues':
        return <AlertTriangle size={16} color="#f59e0b" />;
      case 'not-tested':
        return <Clock size={16} color="#6b7280" />;
    }
  };

  const getStatusColor = (status: ModuleStatus['status']) => {
    switch (status) {
      case 'working':
        return '#10b981';
      case 'issues':
        return '#f59e0b';
      case 'not-tested':
        return '#6b7280';
    }
  };

  const workingCount = modules.filter(m => m.status === 'working').length;
  const issuesCount = modules.filter(m => m.status === 'issues').length;
  const notTestedCount = modules.filter(m => m.status === 'not-tested').length;

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Integration Status Dashboard</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Frontend-Backend integration status for all modules
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={checkBackendStatus}>
            <RefreshCw size={12} /> Check Backend
          </button>
          <a href="/test-api" className="btn btn-primary btn-sm">
            <ExternalLink size={12} /> Run API Tests
          </a>
        </div>
      </div>

      {/* Backend Status */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {backendStatus === 'checking' ? (
              <Loader2 className="animate-spin" size={16} color="#6366f1" />
            ) : backendStatus === 'online' ? (
              <CheckCircle2 size={16} color="#10b981" />
            ) : (
              <XCircle size={16} color="#ef4444" />
            )}
            <span style={{ fontWeight: 700 }}>Backend Server</span>
          </div>
          <div style={{ 
            padding: '4px 8px', 
            borderRadius: 4, 
            fontSize: 11, 
            fontWeight: 600,
            background: backendStatus === 'online' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: backendStatus === 'online' ? '#10b981' : '#ef4444'
          }}>
            {backendStatus === 'checking' ? 'Checking...' : backendStatus === 'online' ? 'Online' : 'Offline'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177'}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ flex: 1, padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Working</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>{workingCount}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Issues</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>{issuesCount}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Not Tested</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#6b7280' }}>{notTestedCount}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Success Rate</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: workingCount / modules.length >= 0.7 ? '#10b981' : '#f59e0b' }}>
            {Math.round((workingCount / modules.length) * 100)}%
          </div>
        </div>
      </div>

      {/* Module Status List */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--bg-border)' }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Module Integration Status</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Click module names to navigate and test functionality</div>
        </div>
        
        <div style={{ padding: 16 }}>
          {modules.map((module, i) => (
            <div key={i} style={{ 
              padding: 16, 
              border: '1px solid var(--bg-border)', 
              borderRadius: 8, 
              marginBottom: 12,
              background: 'var(--bg-elevated)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {getStatusIcon(module.status)}
                  <a 
                    href={module.path} 
                    style={{ 
                      fontSize: 14, 
                      fontWeight: 700, 
                      color: 'var(--text-primary)', 
                      textDecoration: 'none' 
                    }}
                  >
                    {module.name}
                  </a>
                </div>
                <span style={{ 
                  padding: '2px 6px', 
                  borderRadius: 4, 
                  fontSize: 10, 
                  fontWeight: 600,
                  background: `${getStatusColor(module.status)}20`,
                  color: getStatusColor(module.status)
                }}>
                  {module.status.replace('-', ' ').toUpperCase()}
                </span>
              </div>
              
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                {module.description}
              </div>

              {module.issues.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', marginBottom: 4 }}>Known Issues:</div>
                  {module.issues.map((issue, j) => (
                    <div key={j} style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                      • {issue}
                    </div>
                  ))}
                </div>
              )}

              {module.fixes.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#10b981', marginBottom: 4 }}>Recent Fixes:</div>
                  {module.fixes.map((fix, j) => (
                    <div key={j} style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                      {fix}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="alert alert-info" style={{ marginTop: 20 }}>
        <AlertTriangle size={16} />
        <div>
          <div style={{ fontWeight: 700 }}>Next Steps for Production Readiness</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            <ol style={{ marginLeft: 16, marginTop: 8 }}>
              <li>Ensure backend is running on port 5177</li>
              <li>Fix Redis connection issues (add abortConnect=false to connection string)</li>
              <li>Run API tests to identify specific endpoint issues</li>
              <li>Test each module thoroughly with real data</li>
              <li>Verify all CRUD operations work correctly</li>
              <li>Check authentication and authorization flows</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}