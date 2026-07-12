'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, CheckCircle2, XCircle, AlertTriangle, 
  Loader2, Search, FileText, Check, X, ArrowRight, Calendar, User, 
  TrendingUp, CreditCard, Hash, ChevronRight, Ban, RefreshCw, Eye, Info
} from 'lucide-react';
import { collectionRequestService, CollectionRequest } from '@/services/collectionRequestService';
import { useAuth } from '@/context/AuthContext';

export default function CollectionRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CollectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // request ID of active action
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('Pending'); // default to Pending
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<CollectionRequest | null>(null);

  // Role checks
  const isAdmin = user?.role === 'super_admin' || user?.role === 'branch_manager';

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      // Pass status filter if not 'All'
      const status = statusFilter === 'All' ? undefined : statusFilter;
      const response = await collectionRequestService.getAllRequests(status);
      if (response.success) {
        setRequests(response.data);
      } else {
        setError('Failed to retrieve collection requests.');
      }
    } catch (err: any) {
      console.error('Error fetching requests:', err);
      setError(err.message || 'Failed to fetch collection requests. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleApprove = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to APPROVE this collection request? This will update the loan balance immediately.')) return;
    
    setActionLoading(id);
    setError(null);
    setSuccess(null);
    try {
      const res = await collectionRequestService.approveRequest(id);
      if (res.success) {
        setSuccess(`✅ Request ${res.data.requestNumber} approved successfully. Installment payment has been applied.`);
        fetchRequests();
        if (selectedRequest && selectedRequest.id === id) {
          setSelectedRequest(null);
        }
      } else {
        setError(res.message || 'Failed to approve request.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve request.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to REJECT this collection request?')) return;
    
    setActionLoading(id);
    setError(null);
    setSuccess(null);
    try {
      const res = await collectionRequestService.rejectRequest(id);
      if (res.success) {
        setSuccess(`❌ Request ${res.data.requestNumber} rejected.`);
        fetchRequests();
        if (selectedRequest && selectedRequest.id === id) {
          setSelectedRequest(null);
        }
      } else {
        setError(res.message || 'Failed to reject request.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject request.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to CANCEL this collection request?')) return;
    
    setActionLoading(id);
    setError(null);
    setSuccess(null);
    try {
      const res = await collectionRequestService.cancelRequest(id);
      if (res.success) {
        setSuccess(`✅ Request ${res.data.requestNumber} cancelled successfully.`);
        fetchRequests();
        if (selectedRequest && selectedRequest.id === id) {
          setSelectedRequest(null);
        }
      } else {
        setError(res.message || 'Failed to cancel request.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cancel request.');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter requests locally by search term
  const filteredRequests = requests.filter(req => {
    const term = searchTerm.toLowerCase();
    const matchesReqNum = req.requestNumber?.toLowerCase().includes(term);
    const matchesCustomer = req.loanCase?.customer?.name?.toLowerCase().includes(term) ||
      req.loanCase?.customer?.customerCode?.toLowerCase().includes(term);
    const matchesLoan = req.loanCase?.loanCode?.toLowerCase().includes(term);
    const matchesAgent = req.requestedBy?.name?.toLowerCase().includes(term);
    
    return matchesReqNum || matchesCustomer || matchesLoan || matchesAgent;
  });

  // Count stats
  const pendingCount = requests.filter(r => r.status === 'Pending').length;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pending': return 'badge-warning';
      case 'Approved': return 'badge-success';
      case 'Rejected': return 'badge-danger';
      case 'Cancelled': return 'badge-gray';
      default: return 'badge-info';
    }
  };

  return (
    <div className="fade-in-up" style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardList size={22} color="#6366f1" /> Collection Approval Workflow
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Review, audit, approve or reject loan dues collection entry requests submitted by officers
          </p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={fetchRequests} 
          disabled={loading}
          style={{ height: 40, gap: 6 }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          <AlertTriangle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      {/* Status Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Loader2 size={20} className="pulse-dot" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pending Approvals</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
              {statusFilter === 'Pending' ? filteredRequests.length : '—'}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Approved (Current List)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
              {statusFilter === 'Approved' ? filteredRequests.length : '—'}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <XCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Rejected (Current List)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
              {statusFilter === 'Rejected' ? filteredRequests.length : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="card">
        {/* Filters and Search Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', padding: 4, borderRadius: 8 }}>
            {['Pending', 'Approved', 'Rejected', 'Cancelled', 'All'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: statusFilter === status ? '#6366f1' : 'transparent',
                  color: statusFilter === status ? 'white' : 'var(--text-secondary)',
                  transition: '0.2s'
                }}
              >
                {status}
                {status === 'Pending' && pendingCount > 0 && (
                  <span style={{
                    marginLeft: 6,
                    padding: '1px 6px',
                    fontSize: 10,
                    borderRadius: 99,
                    background: statusFilter === 'Pending' ? 'white' : '#f59e0b',
                    color: statusFilter === 'Pending' ? '#6366f1' : 'white'
                  }}>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div style={{ display: 'flex', gap: 10, minWidth: 300, flex: 1, justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 350 }}>
              <input
                type="text"
                className="input"
                placeholder="Search requests, customer, loan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 36, height: 38 }}
              />
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
            </div>
          </div>
        </div>

        {/* Requests Table */}
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Loader2 size={32} className="animate-spin" color="#6366f1" />
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading collection requests...</div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Info size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>No collection requests found</div>
            <p style={{ fontSize: 12 }}>There are no requests matching the selected filter or search term.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request No</th>
                  <th>Customer</th>
                  <th>Loan Code</th>
                  <th>Amount</th>
                  <th>Payment details</th>
                  <th>Date Requested</th>
                  <th>Requested By</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr 
                    key={req.id} 
                    onClick={() => setSelectedRequest(req)}
                    style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                  >
                    <td className="primary" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#6366f1' }}>
                      {req.requestNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {req.loanCase?.customer?.name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        Code: {req.loanCase?.customer?.customerCode || '—'}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {req.loanCase?.loanCode || '—'}
                    </td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>
                      ₹{(req.amount / 100).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="badge badge-purple" style={{ fontSize: 10, padding: '2px 6px' }}>
                          {req.paymentMode}
                        </span>
                      </div>
                      {req.utrRef && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'monospace' }}>
                          Ref: {req.utrRef}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} color="var(--text-muted)" />
                        {new Date(req.requestedAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: 'var(--bg-border)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700
                        }}>
                          {req.requestedBy?.name?.slice(0, 2).toUpperCase() || 'CO'}
                        </div>
                        <span>{req.requestedBy?.name || 'Agent'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          style={{ padding: 6 }}
                          onClick={() => setSelectedRequest(req)}
                          title="View Details"
                        >
                          <Eye size={13} />
                        </button>
                        
                        {req.status === 'Pending' && isAdmin && (
                          <>
                            <button
                              className="btn btn-sm btn-primary"
                              style={{ 
                                padding: '4px 8px', 
                                background: 'var(--brand-success)', 
                                borderColor: 'var(--brand-success)',
                                color: 'white',
                                minWidth: 64,
                                height: 28
                              }}
                              disabled={actionLoading === req.id}
                              onClick={(e) => handleApprove(req.id, e)}
                            >
                              {actionLoading === req.id ? <Loader2 size={12} className="animate-spin" /> : <><Check size={12} style={{ marginRight: 2 }} /> Approve</>}
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ 
                                padding: '4px 8px', 
                                background: 'rgba(239, 68, 68, 0.1)', 
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                minWidth: 60,
                                height: 28
                              }}
                              disabled={actionLoading === req.id}
                              onClick={(e) => handleReject(req.id, e)}
                            >
                              {actionLoading === req.id ? <Loader2 size={12} className="animate-spin" /> : <><X size={12} style={{ marginRight: 2 }} /> Reject</>}
                            </button>
                          </>
                        )}

                        {req.status === 'Pending' && !isAdmin && req.requestedById === user?.id && (
                          <button
                            className="btn btn-sm"
                            style={{ 
                              padding: '4px 8px', 
                              background: 'rgba(100, 100, 120, 0.1)', 
                              border: '1px solid rgba(100, 100, 120, 0.3)',
                              color: '#9494aa',
                              height: 28
                            }}
                            disabled={actionLoading === req.id}
                            onClick={(e) => handleCancel(req.id, e)}
                          >
                            {actionLoading === req.id ? <Loader2 size={12} className="animate-spin" /> : <><Ban size={12} style={{ marginRight: 2 }} /> Cancel</>}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Side-Drawer/Modal */}
      {selectedRequest && (
        <div style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0, left: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 1000,
          transition: '0.3s'
        }} onClick={() => setSelectedRequest(null)}>
          <div 
            style={{
              width: '100%',
              maxWidth: 500,
              background: 'var(--bg-card)',
              height: '100%',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              padding: 24,
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--bg-border)', paddingBottom: 16 }}>
              <div>
                <span className={`badge ${getStatusBadgeClass(selectedRequest.status)}`} style={{ marginBottom: 8 }}>
                  {selectedRequest.status}
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>Request {selectedRequest.requestNumber}</h2>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)}
                style={{ 
                  background: 'none', border: 'none', cursor: 'pointer', 
                  color: 'var(--text-muted)'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Financial Summary Card */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)', 
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 12, padding: 16 
              }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Collection Amount</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#10b981' }}>
                  ₹{(selectedRequest.amount / 100).toLocaleString()}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Previous Dues</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>
                      ₹{(selectedRequest.previousDueAmount / 100).toLocaleString()}
                    </div>
                  </div>
                  <ArrowRight size={14} color="var(--text-muted)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Projected Dues</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#6366f1' }}>
                      ₹{(selectedRequest.newDueAmount / 100).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan and Customer details */}
              <div className="card-elevated" style={{ padding: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', marginBottom: 12 }}>Customer & Loan Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Customer Name</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedRequest.loanCase?.customer?.name || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Customer Code</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedRequest.loanCase?.customer?.customerCode || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Loan Code</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>{selectedRequest.loanCase?.loanCode || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Installment No</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Installment #{selectedRequest.installment?.no || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="card-elevated" style={{ padding: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', marginBottom: 12 }}>Payment Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Payment Mode:</span>
                    <span className="badge badge-purple">{selectedRequest.paymentMode}</span>
                  </div>
                  {selectedRequest.utrRef && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>UTR Reference:</span>
                      <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{selectedRequest.utrRef}</span>
                    </div>
                  )}
                  {selectedRequest.remarks && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Agent Remarks:</span>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: 8, borderRadius: 6, fontStyle: 'italic' }}>
                        "{selectedRequest.remarks}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Audit trail */}
              <div className="card-elevated" style={{ padding: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', marginBottom: 12 }}>Audit Trail & Security</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Submitted By:</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{selectedRequest.requestedBy?.name || 'Agent'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Submitted At:</span>
                    <span style={{ fontSize: 12 }}>{new Date(selectedRequest.requestedAt).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>IP Address:</span>
                    <span style={{ fontSize: 12, fontFamily: 'monospace' }}>{selectedRequest.ipAddress}</span>
                  </div>
                  {selectedRequest.approvedBy && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Reviewed By:</span>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{selectedRequest.approvedBy.name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Reviewed At:</span>
                        <span style={{ fontSize: 12 }}>{selectedRequest.approvedAt ? new Date(selectedRequest.approvedAt).toLocaleString() : '—'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            {selectedRequest.status === 'Pending' && (
              <div style={{ display: 'flex', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--bg-border)' }}>
                {isAdmin ? (
                  <>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, background: 'var(--brand-success)', borderColor: 'var(--brand-success)', color: 'white', height: 40 }}
                      disabled={actionLoading === selectedRequest.id}
                      onClick={() => handleApprove(selectedRequest.id)}
                    >
                      {actionLoading === selectedRequest.id ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} style={{ marginRight: 4 }} /> Approve Request</>}
                    </button>
                    <button
                      className="btn"
                      style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', height: 40 }}
                      disabled={actionLoading === selectedRequest.id}
                      onClick={() => handleReject(selectedRequest.id)}
                    >
                      {actionLoading === selectedRequest.id ? <Loader2 size={16} className="animate-spin" /> : <><X size={16} style={{ marginRight: 4 }} /> Reject Request</>}
                    </button>
                  </>
                ) : selectedRequest.requestedById === user?.id ? (
                  <button
                    className="btn"
                    style={{ width: '100%', background: 'rgba(100, 100, 120, 0.1)', border: '1px solid rgba(100, 100, 120, 0.3)', color: '#9494aa', height: 40 }}
                    disabled={actionLoading === selectedRequest.id}
                    onClick={() => handleCancel(selectedRequest.id)}
                  >
                    {actionLoading === selectedRequest.id ? <Loader2 size={16} className="animate-spin" /> : <><Ban size={16} style={{ marginRight: 4 }} /> Cancel Request</>}
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
