'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, XCircle, Clock, Search, AlertCircle, RefreshCw, 
  ChevronRight, FileText, User, Calendar, DollarSign, ShieldAlert,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { loanService, LoanCase } from '@/services/loanService';

export default function LoanApprovalsPage() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<LoanCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  
  // Rejection Dialog state
  const [rejectingLoanId, setRejectingLoanId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actioning, setActioning] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'branch_manager';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get all pending loan cases
      const pendingLoans = await loanService.getPendingApprovals();
      setLoans(pendingLoans);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load pending loan applications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Approve action handler
  const handleApprove = async (id: string) => {
    if (!window.confirm('Are you sure you want to approve this loan case for disbursement?')) return;
    setActioning(true);
    setError(null);
    try {
      await loanService.approveLoan(id);
      setSuccessMsg('Loan application approved successfully!');
      setLoans(prev => prev.filter(l => l.id !== id));
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to approve loan case.');
    } finally {
      setActioning(false);
    }
  };

  // Reject action handler
  const handleReject = async () => {
    if (!rejectingLoanId || !rejectReason.trim()) return;
    setActioning(true);
    setError(null);
    try {
      await loanService.rejectLoan(rejectingLoanId, rejectReason);
      setSuccessMsg('Loan application rejected successfully.');
      setLoans(prev => prev.filter(l => l.id !== rejectingLoanId));
      setRejectingLoanId(null);
      setRejectReason('');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reject loan case.');
    } finally {
      setActioning(false);
    }
  };

  // Enforce access control
  if (!isAdmin) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontWeight: 800 }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
          Only Branch Managers and Super Admins can access the Loan Approvals dashboard.
        </p>
      </div>
    );
  }

  const filtered = loans.filter(l => {
    const query = searchTerm.toLowerCase();
    return (
      l.loanCode?.toLowerCase().includes(query) ||
      l.customerName?.toLowerCase().includes(query) ||
      l.customerCode?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="fade-in-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={20} color="#6366f1" /> Loan Approvals Dashboard
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Review, authorize, and disburse pending loan applications
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 16, borderRadius: 12 }}>
          <AlertCircle size={15} /><span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: 16, borderRadius: 12 }}>
          <CheckCircle2 size={15} /><span>{successMsg}</span>
        </div>
      )}

      {/* Stats Summary cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={18} color="#6366f1" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{loans.length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Pending Review</div>
          </div>
        </div>
        
        <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Active Flow</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>ACID Locked Logs</div>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            style={{ paddingLeft: 36 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by Code or Customer..."
          />
        </div>
      </div>

      {/* Approvals Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 size={28} className="animate-spin" color="#6366f1" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <Clock size={40} color="var(--text-muted)" style={{ marginBottom: 14, opacity: 0.4 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-muted)' }}>
            No pending loan applications for review
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 16 }}>Loan Code</th>
                <th>Borrower</th>
                <th>Principal Amount</th>
                <th>Interest Component</th>
                <th>Total Receivable</th>
                <th>Status</th>
                <th style={{ paddingRight: 16 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(loan => (
                <tr key={loan.id}>
                  <td style={{ paddingLeft: 16 }}>
                    <span className="mono" style={{ fontSize: 11, background: 'var(--bg-elevated)', padding: '3px 7px', borderRadius: 5, fontWeight: 700 }}>
                      {loan.loanCode || 'LN-NEW'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{loan.customerName || 'Borrower'}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{loan.customerCode}</div>
                    {loan.documentUrls && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        {loan.documentUrls.split(',').map((url: string, i: number) => {
                          const cleanUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177'}${url}`;
                          return (
                            <a
                              key={i}
                              href={cleanUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '2px 6px', borderRadius: 4, textDecoration: 'none', fontWeight: 600 }}
                            >
                              <FileText size={10} /> KYC Doc {i+1}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: 700 }}>₹{( (loan.principal || loan.financeAmount || 0) / 100).toLocaleString()}</td>
                  <td style={{ color: '#ef4444' }}>₹{((loan.interestAmount || 0) / 100).toLocaleString()}</td>
                  <td style={{ color: '#6366f1', fontWeight: 800 }}>₹{((loan.totalReceivable || 0) / 100).toLocaleString()}</td>
                  <td>
                    <span className="badge badge-warning">● Pending Approval</span>
                  </td>
                  <td style={{ paddingRight: 16 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button 
                        className="btn btn-primary btn-sm"
                        disabled={actioning}
                        onClick={() => handleApprove(loan.id)}
                        style={{ background: 'var(--grad-success)', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <CheckCircle2 size={12} /> Approve
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        disabled={actioning}
                        onClick={() => setRejectingLoanId(loan.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rejection Dialog */}
      {rejectingLoanId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: 440 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Reject Loan Case</div>
            <textarea
              className="form-control"
              style={{ minHeight: 100, marginBottom: 16 }}
              placeholder="Provide a detailed reason for rejection..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setRejectingLoanId(null); setRejectReason(''); }}>Cancel</button>
              <button 
                className="btn btn-primary" 
                disabled={actioning || !rejectReason.trim()}
                onClick={handleReject}
                style={{ background: '#ef4444', border: 'none' }}
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
