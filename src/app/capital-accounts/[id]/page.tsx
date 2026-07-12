'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Loader2, AlertCircle, CheckCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import capitalAccountService, { CapitalAccount } from '@/services/capitalAccountService';

interface TransactionView {
  id: string;
  transactionCode?: string;
  transactionType: 'Contribution' | 'Withdrawal' | 'Distribution';
  type?: 'Contribution' | 'Withdrawal' | 'Distribution'; // Alias for compatibility
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  transactionDate: string;
  description?: string;
  referenceNumber?: string;
  rejectionReason?: string;
  createdAt?: string;
}

export default function CapitalAccountDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const accountId = params.id as string;

  const [account, setAccount] = useState<CapitalAccount | null>(null);
  const [transactions, setTransactions] = useState<TransactionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  // Check access control
  useEffect(() => {
    if (user && user.role !== 'super_admin' && user.role !== 'branch_manager') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Fetch account details and transactions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch account
        const accountData = await capitalAccountService.getById(accountId);
        setAccount(accountData);

        // Fetch transactions
        const transactionsData = await capitalAccountService.getTransactions(accountId);
        setTransactions(transactionsData);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError('Failed to load account details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (accountId) {
      fetchData();
    }
  }, [accountId]);

  const handleRecordTransaction = () => {
    router.push(`/capital-accounts/${accountId}/transactions/new`);
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const accountData = await capitalAccountService.getById(accountId);
      setAccount(accountData);

      const transactionsData = await capitalAccountService.getTransactions(accountId);
      setTransactions(transactionsData);
    } catch (err: any) {
      console.error('Refresh error:', err);
      setError('Failed to refresh data.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'badge-warning';
      case 'Approved':
        return 'badge-success';
      case 'Rejected':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const getTransactionIcon = (type: string | undefined) => {
    const transType = type || '';
    if (transType === 'Contribution') return <TrendingUp size={14} color="#10b981" />;
    if (transType === 'Withdrawal') return <TrendingDown size={14} color="#ef4444" />;
    return null;
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
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading account details...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="fade-in-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => router.back()} className="btn btn-secondary">
            <ArrowLeft size={16} />
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Account Not Found</h1>
        </div>

        <div className="alert alert-danger">
          <AlertCircle size={16} />
          <span>The requested capital account could not be found.</span>
        </div>
      </div>
    );
  }

  const pendingCount = transactions.filter((t) => t.status === 'Pending').length;
  const approvedCount = transactions.filter((t) => t.status === 'Approved').length;

  return (
    <div className="fade-in-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => router.back()}
          className="btn btn-secondary"
          title="Go back"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
            Account: {account.capitalAccountCode || 'N/A'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {account.partnerName} • Partner Code: {account.partnerCode}
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20, borderRadius: 12 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: 20, borderRadius: 12 }}>
          <CheckCircle size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Account Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 180, padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>
            Current Balance
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>{formatAmount(account.currentBalance)}</div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Opening: {formatAmount(account.openingBalance)}
          </p>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 180, padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>
            Ownership %
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>
            {account.ownershipPercentage.toFixed(2)}%
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Based on capital contribution
          </p>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 180, padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>
            Transactions
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#6366f1' }}>{transactions.length}</div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            {approvedCount} approved • {pendingCount} pending
          </p>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={handleRecordTransaction}>
          <Plus size={16} /> Record Transaction
        </button>
        <button className="btn btn-secondary" onClick={handleRefresh}>
          Refresh
        </button>
      </div>

      {/* Transaction History */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Transaction History</h2>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ padding: '14px 16px' }}>Code</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Reference</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="primary mono" style={{ fontWeight: 700, color: '#6366f1', padding: '14px 16px' }}>
                    {transaction.transactionCode || 'N/A'}
                  </td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    {getTransactionIcon(transaction.transactionType)}
                    {transaction.transactionType}
                  </td>
                  <td
                    style={{
                      fontWeight: 600,
                      color: transaction.transactionType === 'Contribution' ? '#10b981' : '#ef4444',
                    }}
                  >
                    {transaction.transactionType === 'Contribution' ? '+' : '-'}{formatAmount(transaction.amount)}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(transaction.transactionDate).toLocaleDateString()}
                  </td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    {transaction.referenceNumber || '-'}
                  </td>
                  <td>
                    <span
                      className={`badge ${getStatusColor(transaction.status)}`}
                      style={{ width: 'fit-content' }}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {transaction.createdAt
                      ? new Date(transaction.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No transactions recorded yet. Record your first transaction to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Account Info */}
      <div className="card" style={{ marginTop: 20, padding: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Account Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Status:</span>
            <span style={{ marginLeft: 8, fontWeight: 600 }}>{account.status}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Currency:</span>
            <span style={{ marginLeft: 8, fontWeight: 600 }}>{account.currency || 'INR'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Created:</span>
            <span style={{ marginLeft: 8, fontWeight: 600 }}>
              {account.createdAt ? new Date(account.createdAt).toLocaleString() : 'N/A'}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Last Modified:</span>
            <span style={{ marginLeft: 8, fontWeight: 600 }}>
              {account.lastModifiedAt ? new Date(account.lastModifiedAt).toLocaleString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
