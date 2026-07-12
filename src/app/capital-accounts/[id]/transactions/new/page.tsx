'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import capitalAccountService from '@/services/capitalAccountService';

export default function NewTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const accountId = params.id as string;

  const [transactionType, setTransactionType] = useState<'Contribution' | 'Withdrawal' | 'Distribution'>('Contribution');
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Check access control
  useEffect(() => {
    if (user && user.role !== 'super_admin' && user.role !== 'branch_manager') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');

    // Validation
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid transaction amount (in rupees)');
      return;
    }

    if (!transactionDate) {
      setError('Please select a transaction date');
      return;
    }

    try {
      setLoading(true);

      // Convert rupees to paise
      const amountInPaise = Math.round(Number(amount) * 100);

      // Create transaction
      await capitalAccountService.recordTransaction(accountId, {
        type: transactionType,
        amount: amountInPaise,
        transactionDate: new Date(transactionDate).toISOString(),
        description: description || undefined,
        referenceNumber: referenceNumber || undefined,
      });

      setSuccessMessage('Transaction recorded successfully! It is now pending approval.');
      setTimeout(() => {
        router.push(`/capital-accounts/${accountId}`);
      }, 1500);
    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.message || 'Failed to record transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTransactionType('Contribution');
    setAmount('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setReferenceNumber('');
    setError(null);
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'Contribution':
        return '#10b981';
      case 'Withdrawal':
        return '#ef4444';
      case 'Distribution':
        return '#f59e0b';
      default:
        return '#6366f1';
    }
  };

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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Record Capital Transaction</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Record a new contribution, withdrawal, or distribution</p>
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

      <div className="card" style={{ maxWidth: 600, padding: 24 }}>
        <form onSubmit={handleSubmit}>
          {/* Transaction Type */}
          <div style={{ marginBottom: 20 }}>
            <label className="input-label">
              Transaction Type
              <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {(['Contribution', 'Withdrawal', 'Distribution'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTransactionType(type)}
                  style={{
                    padding: '12px',
                    border: transactionType === type ? '2px solid' + getTransactionColor(type) : '1px solid var(--border-color)',
                    borderRadius: 6,
                    background: transactionType === type ? getTransactionColor(type) + '15' : 'var(--bg-base)',
                    color: getTransactionColor(type),
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  {type === 'Contribution' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div style={{ marginBottom: 20 }}>
            <label className="input-label">
              Amount (in Rupees)
              <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: getTransactionColor(transactionType) }}>
                {transactionType === 'Contribution' ? '+' : '-'}₹
              </span>
              <input
                type="number"
                placeholder="Enter transaction amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  fontSize: 13,
                  boxSizing: 'border-box',
                  backgroundColor: 'var(--bg-base)',
                }}
              />
            </div>
            {amount && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                = {transactionType === 'Contribution' ? '+' : '-'}
                ₹{(Number(amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
          </div>

          {/* Transaction Date */}
          <div style={{ marginBottom: 20 }}>
            <label className="input-label">
              Transaction Date
              <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                fontSize: 13,
                boxSizing: 'border-box',
                backgroundColor: 'var(--bg-base)',
              }}
            />
          </div>

          {/* Reference Number */}
          <div style={{ marginBottom: 20 }}>
            <label className="input-label">Reference Number (Optional)</label>
            <input
              type="text"
              placeholder="e.g., CHQ123456, BANK-TXN-001"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                fontSize: 13,
                boxSizing: 'border-box',
                backgroundColor: 'var(--bg-base)',
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <label className="input-label">Description (Optional)</label>
            <textarea
              placeholder="Enter transaction description or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                fontSize: 13,
                boxSizing: 'border-box',
                backgroundColor: 'var(--bg-base)',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Info Section */}
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 8,
              padding: 12,
              marginBottom: 20,
              fontSize: 12,
            }}
          >
            <div style={{ fontWeight: 600, color: '#6366f1', marginBottom: 6 }}>Transaction Details</div>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, paddingLeft: 16 }}>
              <li>Transaction will be recorded in "Pending" status</li>
              <li>Requires approval from branch manager or super admin</li>
              <li>On approval, capital balance and ownership % will be auto-updated</li>
              <li>A journal entry will be created for accounting</li>
              <li>All transactions are audited for compliance</li>
            </ul>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !amount}
              style={{ backgroundColor: getTransactionColor(transactionType) }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {loading ? 'Recording...' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
