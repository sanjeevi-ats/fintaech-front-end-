'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Loader2, AlertCircle, Clock, User, Calendar, IndianRupee, RefreshCw } from 'lucide-react';
import { collectionService, CollectionRequestDto } from '@/services/collectionService';
import { useAuth } from '@/context/AuthContext';

export default function CollectionApprovalsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CollectionRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Role-based access control
  const hasApprovalAccess = user?.role === 'super_admin' || user?.role === 'branch_manager';

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!hasApprovalAccess) {
        setError('You do not have permission to approve collection requests');
        return;
      }

      console.log('📋 Fetching collection requests with status:', filter);
      const response = await collectionService.getPendingCollectionRequests(filter);
      
      if (response.success && response.data) {
        setRequests(response.data);
        console.log(`✅ Loaded ${response.data.length} collection requests`);
      } else {
        setRequests([]);
      }
    } catch (err: any) {
      console.error('Error fetching requests:', err);
      setError(err.message || 'Failed to load collection requests');
    } finally {
      setLoading(false);
    }
  }, [filter, hasApprovalAccess]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      setError(null);
      setSuccessMessage(null);

      console.log('🔄 Approving request:', requestId);
      const response = await collectionService.approveCollectionRequest(requestId);
      
      if (response.success) {
        setSuccessMessage(`✅ Collection request approved successfully! Receipt generated.`);
        setTimeout(() => {
          fetchRequests();
          setSuccessMessage(null);
        }, 2000);
      }
    } catch (err: any) {
      console.error('Approval error:', err);
      setError(err.message || 'Failed to approve collection request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      setError(null);
      setSuccessMessage(null);

      console.log('🔄 Rejecting request:', requestId);
      const response = await collectionService.rejectCollectionRequest(requestId);
      
      if (response.success) {
        setSuccessMessage(`✅ Collection request rejected.`);
        setTimeout(() => {
          fetchRequests();
          setSuccessMessage(null);
        }, 2000);
      }
    } catch (err: any) {
      console.error('Rejection error:', err);
      setError(err.message || 'Failed to reject collection request');
    } finally {
      setProcessingId(null);
    }
  };

  if (!hasApprovalAccess) {
    return (
      <div className="fade-in-up">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Access Denied</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            Only Super Admin and Branch Manager can access collection approvals.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Your role: {user?.role}</p>
        </div>
      </div>
    );
  }

  if (loading && requests.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading collection requests...</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={20} color="#6366f1" /> Collection Approvals
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Review and approve pending collection requests</p>
        </div>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={fetchRequests}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20, borderRadius: 12 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: 20, borderRadius: 12 }}>
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14, marginBottom: 20 }}>
        {['Pending', 'Approved', 'Rejected'].map((status) => {
          const count = requests.filter(r => r.status === status).length;
          const color = status === 'Pending' ? '#f59e0b' : status === 'Approved' ? '#10b981' : '#ef4444';
          
          return (
            <div key={status} className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>
                {status} Requests
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color }}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['Pending', 'Approved', 'Rejected'].map((status) => (
          <button
            key={status}
            className={`btn btn-sm ${filter === status ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(status as any)}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="card" style={{ padding: 0 }}>
        {requests.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 16 }}>#</th>
                <th>Request #</th>
                <th>Customer</th>
                <th>Loan Code</th>
                <th>Amount</th>
                <th>Payment Mode</th>
                <th>Requested By</th>
                <th>Requested Date</th>
                <th>Status</th>
                <th style={{ paddingRight: 16 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req, idx) => (
                <tr key={req.id}>
                  <td style={{ paddingLeft: 16, color: 'var(--text-muted)', fontSize: 11 }}>{idx + 1}</td>
                  <td className="mono" style={{ fontSize: 11, fontWeight: 700 }}>{req.requestNumber}</td>
                  <td className="primary">{req.customerName}</td>
                  <td className="mono" style={{ fontSize: 11 }}>{req.loanCode || req.loanCaseId.slice(0, 8)}</td>
                  <td style={{ fontWeight: 700, color: '#f59e0b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <IndianRupee size={14} />
                      {(req.amount / 100).toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">{req.paymentMode}</span>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={12} color="var(--text-muted)" />
                      {req.requestedByName || 'Unknown'}
                    </div>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} />
                      {new Date(req.requestedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      req.status === 'Pending' ? 'badge-warning' :
                      req.status === 'Approved' ? 'badge-success' :
                      'badge-danger'
                    }`}>
                      {req.status === 'Pending' ? '⏳ Pending' :
                       req.status === 'Approved' ? '✓ Approved' :
                       '✗ Rejected'}
                    </span>
                  </td>
                  <td style={{ paddingRight: 16 }}>
                    {req.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleApprove(req.id)}
                          disabled={processingId === req.id || loading}
                          title="Approve"
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          {processingId === req.id ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={11} />
                          )}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleReject(req.id)}
                          disabled={processingId === req.id || loading}
                          title="Reject"
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          {processingId === req.id ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <XCircle size={11} />
                          )}
                        </button>
                      </div>
                    )}
                    {req.status === 'Approved' && (
                      <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                        ✓ Approved by {req.approvedByName || 'Admin'}
                      </div>
                    )}
                    {req.status === 'Rejected' && (
                      <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>
                        ✗ Rejected
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Clock size={32} color="var(--text-muted)" style={{ marginBottom: 12, opacity: 0.5 }} />
            <p>No {filter.toLowerCase()} collection requests</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div style={{ 
        marginTop: 16, 
        padding: 16, 
        background: 'rgba(99,102,241,0.08)', 
        borderRadius: 8,
        fontSize: 12,
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontWeight: 600 }}>
          <Clock size={14} />
          Collection Approval Workflow
        </div>
        <ul style={{ marginLeft: 22, marginTop: 8 }}>
          <li>✓ Collection Officers submit collection requests</li>
          <li>✓ Admin/Branch Manager reviews and approves/rejects</li>
          <li>✓ Upon approval: Receipt generated, Loan outstanding updated, Journal entry created, Cash balance updated</li>
          <li>✓ Upon rejection: Request stays in system for audit trail</li>
        </ul>
      </div>
    </div>
  );
}
