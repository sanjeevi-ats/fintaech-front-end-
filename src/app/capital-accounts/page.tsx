'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, TrendingUp, Users, DollarSign, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import capitalAccountService, { CapitalAccount, CapitalAccountOverview } from '@/services/capitalAccountService';

interface StatsData {
  totalCapital: number;
  investorCount: number;
  activeAccounts: number;
  averageOwnership: number;
}

export default function CapitalAccountsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<CapitalAccount[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalCapital: 0,
    investorCount: 0,
    activeAccounts: 0,
    averageOwnership: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<CapitalAccount | null>(null);
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active'>('active');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Check access control - only super_admin and branch_manager can see this
  useEffect(() => {
    if (user && user.role !== 'super_admin' && user.role !== 'branch_manager') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Fetch capital accounts and calculate stats
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all accounts
      const allAccounts = await capitalAccountService.getAll();

      // Filter by status if needed
      let filtered: CapitalAccount[] = allAccounts;
      if (filter === 'active') {
        filtered = allAccounts.filter((a) => a.status === 'active');
      }

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            (a.capitalAccountCode?.toLowerCase().includes(query)) ||
            (a.partnerCode?.toLowerCase().includes(query)) ||
            (a.partnerName?.toLowerCase().includes(query))
        );
      }

      // Calculate statistics
      const totalCapital = allAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
      const investorCount = new Set(allAccounts.map((a) => a.partnerId)).size;
      const activeAccounts = allAccounts.filter((a) => a.status === 'active').length;
      const averageOwnership = allAccounts.length > 0 ? allAccounts.reduce((sum, a) => sum + a.ownershipPercentage, 0) / allAccounts.length : 0;

      setAccounts(filtered);
      setStats({
        totalCapital,
        investorCount,
        activeAccounts,
        averageOwnership,
      });
    } catch (err: any) {
      console.error('Fetch accounts error:', err);
      setError('Failed to load capital accounts. Please ensure the backend is running on port 5177.');
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleCreateAccount = () => {
    router.push('/capital-accounts/new');
  };

  const handleViewTransactions = (account: CapitalAccount) => {
    router.push(`/capital-accounts/${account.id}/transactions`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'inactive':
        return 'badge-secondary';
      case 'closed':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const formatAmount = (paise: number): string => {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          gap: 12,
        }}
      >
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading capital accounts...</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Capital Accounts</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Manage investor capital and ownership percentages</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateAccount}>
          <Plus size={16} /> New Account
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={16} />
          <span style={{ flex: 1 }}>{error}</span>
          <button className="btn btn-secondary btn-sm" onClick={fetchAccounts}>
            Retry
          </button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: 20, borderRadius: 12 }}>
          <CheckCircle size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Statistics Cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 200, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>
                Total Capital
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>{formatAmount(stats.totalCapital)}</div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Across {stats.investorCount} investors</p>
            </div>
            <DollarSign size={28} color="#10b981" style={{ opacity: 0.2 }} />
          </div>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 200, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>
                Active Accounts
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>{stats.activeAccounts}</div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Out of {stats.investorCount} total</p>
            </div>
            <TrendingUp size={28} color="#f59e0b" style={{ opacity: 0.2 }} />
          </div>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 200, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>
                Total Investors
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#6366f1' }}>{stats.investorCount}</div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Avg ownership: {stats.averageOwnership.toFixed(2)}%</p>
            </div>
            <Users size={28} color="#6366f1" style={{ opacity: 0.2 }} />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by account code, partner code, or partner name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            fontSize: 13,
            backgroundColor: 'var(--bg-base)',
          }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn btn-sm ${filter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('active')}
          >
            Active Only
          </button>
          <button
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('all')}
          >
            All Accounts
          </button>
          <button className="btn btn-secondary btn-sm" onClick={fetchAccounts}>
            Refresh
          </button>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ padding: '14px 16px' }}>Account Code</th>
              <th>Partner Code</th>
              <th>Partner Name</th>
              <th>Opening Balance</th>
              <th>Current Balance</th>
              <th>Ownership %</th>
              <th>Status</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length > 0 ? (
              accounts.map((account) => (
                <tr key={account.id}>
                  <td className="primary mono" style={{ fontWeight: 700, color: '#6366f1', padding: '14px 16px' }}>
                    {account.capitalAccountCode || 'N/A'}
                  </td>
                  <td className="mono" style={{ fontWeight: 600, color: '#10b981' }}>
                    {account.partnerCode || 'N/A'}
                  </td>
                  <td style={{ fontWeight: 500 }}>{account.partnerName || 'Unknown'}</td>
                  <td style={{ fontWeight: 600, color: '#6366f1' }}>{formatAmount(account.openingBalance)}</td>
                  <td style={{ fontWeight: 600, color: '#10b981' }}>{formatAmount(account.currentBalance)}</td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: 14 }}>
                      {account.ownershipPercentage.toFixed(2)}%
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getStatusColor(account.status)}`} style={{ width: 'fit-content' }}>
                      {account.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {account.createdAt ? new Date(account.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleViewTransactions(account)}
                      title="View transactions and details"
                    >
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  {searchQuery ? 'No accounts match your search.' : `No ${filter === 'active' ? 'active ' : ''}capital accounts found. Create one to get started.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Account Detail Modal */}
      {selectedAccount && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div className="card" style={{ width: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Capital Account Details</div>
              <button
                onClick={() => setSelectedAccount(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 18,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <div className="input-label">Account Code</div>
                <div
                  style={{
                    padding: '8px 12px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 6,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#6366f1',
                  }}
                >
                  {selectedAccount.capitalAccountCode || 'N/A'}
                </div>
              </div>
              <div>
                <div className="input-label">Status</div>
                <span className={`badge ${getStatusColor(selectedAccount.status)}`}>
                  {selectedAccount.status}
                </span>
              </div>
              <div>
                <div className="input-label">Partner Code</div>
                <div
                  style={{
                    padding: '8px 12px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 6,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#10b981',
                  }}
                >
                  {selectedAccount.partnerCode || 'N/A'}
                </div>
              </div>
              <div>
                <div className="input-label">Partner Name</div>
                <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6 }}>
                  {selectedAccount.partnerName || 'Unknown'}
                </div>
              </div>
              <div>
                <div className="input-label">Opening Balance</div>
                <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, fontWeight: 600, color: '#6366f1' }}>
                  {formatAmount(selectedAccount.openingBalance)}
                </div>
              </div>
              <div>
                <div className="input-label">Current Balance</div>
                <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, fontWeight: 600, color: '#10b981' }}>
                  {formatAmount(selectedAccount.currentBalance)}
                </div>
              </div>
              <div>
                <div className="input-label">Ownership Percentage</div>
                <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, fontWeight: 700, fontSize: 16, color: '#f59e0b' }}>
                  {selectedAccount.ownershipPercentage.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="input-label">Currency</div>
                <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6 }}>
                  {selectedAccount.currency || 'INR'}
                </div>
              </div>
              {selectedAccount.createdAt && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="input-label">Created</div>
                  <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, fontSize: 12 }}>
                    {new Date(selectedAccount.createdAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedAccount(null)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  handleViewTransactions(selectedAccount);
                  setSelectedAccount(null);
                }}
              >
                <Eye size={14} /> View Transactions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
