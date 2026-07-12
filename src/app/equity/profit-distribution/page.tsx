'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Download, CheckCircle2, XCircle, Loader2, AlertCircle, Eye } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { partnerService } from '@/services/partnerService';
import { useAuth } from '@/context/AuthContext';

export default function CapitalApprovalsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const isAdmin = user?.role === 'super_admin' || user?.role === 'branch_manager';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const list = await partnerService.getAllTransactions();
      setTransactions(list);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(true);
      await partnerService.approveTransaction(id);
      alert('Transaction approved successfully! Balances updated and journal entries posted.');
      fetchData();
    } catch (err: any) {
      alert('Error approving transaction: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionLoading(true);
      await partnerService.rejectTransaction(id);
      alert('Transaction rejected.');
      fetchData();
    } catch (err: any) {
      alert('Error rejecting transaction: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportReport = () => {
    const csvHeaders = 'Transaction Code,Partner Name,Type,Amount,Date,Status,Description\n';
    const csvRows = transactions
      .map((t) => {
        const partnerName = t.capitalAccount?.partner?.name || 'N/A';
        const date = new Date(t.transactionDate).toLocaleDateString();
        const amt = (t.amount / 100).toFixed(2);
        return `"${t.transactionCode}","${partnerName}","${t.transactionType}",${amt},"${date}","${t.status}","${t.description || ''}"`;
      })
      .join('\n');
    const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capital-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const selectedTx = transactions.find((t) => t.id === selectedTxId);

  // Filter transactions
  const filteredTxs = transactions.filter((t) => {
    if (filterStatus === 'all') return true;
    return t.status.toLowerCase() == filterStatus.toLowerCase();
  });

  // Calculate KPIs based on actual backend data
  const totalContributed = transactions
    .filter((t) => t.transactionType === 'Contribution' && t.status === 'Approved')
    .reduce((sum, t) => sum + t.amount / 100, 0);

  const totalWithdrawn = transactions
    .filter((t) => t.transactionType === 'Withdrawal' && t.status === 'Approved')
    .reduce((sum, t) => sum + t.amount / 100, 0);

  const totalPending = transactions
    .filter((t) => t.status === 'Pending')
    .reduce((sum, t) => sum + t.amount / 100, 0);

  if (loading && transactions.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading capital transactions...</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Capital Transactions & Approvals</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Review, approve, or reject partner investments and withdrawals.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={fetchData}>Refresh</button>
          <button className="btn btn-secondary" onClick={handleExportReport}>
            <Download size={13} /> Export Report
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20, borderRadius: 12 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Total Capital Contributed</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>₹{formatNumber(totalContributed)}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Total Capital Withdrawn</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#ec4899' }}>₹{formatNumber(totalWithdrawn)}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Pending Approval Pool</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>₹{formatNumber(totalPending)}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'pending', 'approved', 'rejected'].map((status) => (
          <button
            key={status}
            className={`btn ${filterStatus === status ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatus(status)}
            style={{ textTransform: 'capitalize', fontSize: 12, padding: '6px 12px' }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Main Grid: List + Detail */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedTx ? '1fr 380px' : '1fr', gap: 20 }}>
        
        {/* Table list */}
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 16 }}>Tx Code</th>
                <th>Partner</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                    No transactions found matching this filter.
                  </td>
                </tr>
              ) : (
                filteredTxs.map((t) => {
                  const partnerName = t.capitalAccount?.partner?.name || 'N/A';
                  const typeColor = t.transactionType === 'Contribution' ? '#10b981' : t.transactionType === 'Withdrawal' ? '#ec4899' : '#fbbf24';
                  
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTxId(t.id)}
                      style={{ cursor: 'pointer', background: selectedTxId === t.id ? 'rgba(99,102,241,0.08)' : '' }}
                    >
                      <td style={{ paddingLeft: 16 }} className="mono">{t.transactionCode}</td>
                      <td style={{ fontWeight: 600 }}>{partnerName}</td>
                      <td style={{ color: typeColor, fontWeight: 700 }}>{t.transactionType}</td>
                      <td style={{ fontWeight: 700 }}>₹{formatNumber(t.amount / 100)}</td>
                      <td>{new Date(t.transactionDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${
                          t.status === 'Approved' ? 'badge-success' : t.status === 'Pending' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); setSelectedTxId(t.id); }}>
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Transaction Detail Panel */}
        {selectedTx && (
          <div>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Transaction Details</span>
                <button 
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }} 
                  onClick={() => setSelectedTxId(null)}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Code</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }} className="mono">{selectedTx.transactionCode}</div>
                </div>

                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Partner</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedTx.capitalAccount?.partner?.name || 'N/A'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Code: {selectedTx.capitalAccount?.partner?.partnerCode || 'N/A'}</div>
                </div>

                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Transaction Type</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: selectedTx.transactionType === 'Contribution' ? '#10b981' : '#ec4899' }}>
                    {selectedTx.transactionType}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Amount</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>₹{formatNumber(selectedTx.amount / 100)}</div>
                </div>

                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Date</div>
                  <div style={{ fontSize: 13 }}>{new Date(selectedTx.transactionDate).toLocaleString()}</div>
                </div>

                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Payment Mode / Ref</div>
                  <div style={{ fontSize: 13, textTransform: 'capitalize' }} className="mono">{selectedTx.referenceNumber || 'Cash'}</div>
                </div>

                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Description/Remarks</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selectedTx.description || 'No description provided'}</div>
                </div>

                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Status</div>
                  <span className={`badge ${
                    selectedTx.status === 'Approved' ? 'badge-success' : selectedTx.status === 'Pending' ? 'badge-warning' : 'badge-danger'
                  }`} style={{ alignSelf: 'flex-start' }}>
                    {selectedTx.status}
                  </span>
                </div>
              </div>

              <div className="divider" style={{ margin: '10px 0' }} />

              {selectedTx.status === 'Pending' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {isAdmin ? (
                    <>
                      <button
                        className="btn btn-success"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                        onClick={() => handleApprove(selectedTx.id)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                        Approve & Process
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                        onClick={() => handleReject(selectedTx.id)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                        Reject Request
                      </button>
                    </>
                  ) : (
                    <div style={{ fontSize: 11, color: '#f59e0b', textAlign: 'center', padding: 8, background: 'rgba(245, 158, 11, 0.1)', borderRadius: 6 }}>
                      ⚠️ Approval requires Admin or Branch Manager role. Your current role is {user?.role}.
                    </div>
                  )}
                </div>
              )}

              {selectedTx.status === 'Approved' && (
                <div style={{ padding: 10, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                  <div style={{ fontSize: 12 }}>Processed & posted to GL on {new Date(selectedTx.approvedAt || selectedTx.createdAt).toLocaleDateString()}</div>
                </div>
              )}

              {selectedTx.status === 'Rejected' && (
                <div style={{ padding: 10, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <XCircle size={16} style={{ color: '#ef4444' }} />
                  <div style={{ fontSize: 12 }}>Rejected request.</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
