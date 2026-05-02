'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, FileText, User, Calendar, DollarSign, CheckCircle2, AlertTriangle, 
  Loader2, CreditCard, Clock, TrendingUp, Hash, CheckCircle, Download, Eye, 
  RefreshCw, Filter, BarChart3
} from 'lucide-react';
import { collectionService, LoanInstallmentSummary } from '@/services/collectionService';
import { loanClosureService, LoanClosureStatus } from '@/services/loanClosureService';
import { useAuth } from '@/context/AuthContext';

export default function CollectionsAdvancedPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<LoanInstallmentSummary[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanInstallmentSummary | null>(null);
  const [closureStatus, setClosureStatus] = useState<LoanClosureStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'details' | 'history'>('search');

  // Form data
  const [formData, setFormData] = useState({
    collectionAmount: '',
    remarks: '',
    collectionDate: new Date().toISOString().split('T')[0]
  });

  // Role-based access control
  const hasCollectionAccess = user?.role === 'super_admin' || 
                             user?.role === 'collection_officer' || 
                             user?.role === 'agent';

  // Date validation
  const validateDate = (selectedDate: string) => {
    const today = new Date();
    const selected = new Date(selectedDate);
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);
    return selected <= today;
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }

    setSearching(true);
    setError(null);
    setSearchResults([]);
    setSelectedLoan(null);
    setClosureStatus(null);

    try {
      const results = await collectionService.searchLoanByCustomer(searchTerm);
      if (results.length === 0) {
        setError(`No results found for "${searchTerm}"`);
      } else {
        setSearchResults(results);
        if (results.length === 1) {
          setSelectedLoan(results[0]);
          await loadClosureStatus(results[0].loanId);
        }
      }
    } catch (err: any) {
      setError(`Search failed: ${err.message}`);
    } finally {
      setSearching(false);
    }
  };

  const loadClosureStatus = async (loanId: string) => {
    try {
      const status = await loanClosureService.verifyStatus(loanId);
      setClosureStatus(status);
    } catch (err) {
      console.warn('Failed to load closure status:', err);
    }
  };

  const handleLoanSelect = async (loan: LoanInstallmentSummary) => {
    setSelectedLoan(loan);
    setActiveTab('details');
    const suggestedAmount = loan.currentMonthDue > 0 ? loan.currentMonthDue : loan.nextDueAmount;
    setFormData({
      collectionAmount: (suggestedAmount / 100).toString(),
      remarks: '',
      collectionDate: new Date().toISOString().split('T')[0]
    });
    await loadClosureStatus(loan.loanId);
  };

  const handleSubmitCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasCollectionAccess) {
      setError('You do not have permission to record collections');
      return;
    }

    if (!selectedLoan) {
      setError('Please select a loan first');
      return;
    }

    if (!formData.collectionAmount || parseFloat(formData.collectionAmount) <= 0) {
      setError('Please enter a valid collection amount');
      return;
    }

    if (!validateDate(formData.collectionDate)) {
      setError('Future dates are not allowed for collection');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const collectionAmount = Math.round(parseFloat(formData.collectionAmount) * 100);
      const request = {
        loanId: selectedLoan.loanId,
        customerId: selectedLoan.customerId,
        amount: collectionAmount,
        remarks: formData.remarks,
        collectionDate: formData.collectionDate
      };

      const response = await collectionService.submitCollectionEntry(request);

      if (response.success) {
        setSuccess(`✅ Collection recorded! Receipt: ${response.receiptId}`);
        
        // Refresh data
        setTimeout(async () => {
          const updatedResults = await collectionService.searchLoanByCustomer(searchTerm);
          const updatedLoan = updatedResults.find(l => l.loanId === selectedLoan.loanId);
          if (updatedLoan) {
            setSelectedLoan(updatedLoan);
            setSearchResults(updatedResults);
            await loadClosureStatus(selectedLoan.loanId);
          }
        }, 1500);

        setFormData({
          collectionAmount: '',
          remarks: '',
          collectionDate: new Date().toISOString().split('T')[0]
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to record collection');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoClose = async () => {
    if (!selectedLoan) return;
    
    setSubmitting(true);
    try {
      await loanClosureService.checkAndClose(selectedLoan.loanId);
      setSuccess('✅ Loan closure check completed');
      await loadClosureStatus(selectedLoan.loanId);
    } catch (err: any) {
      setError(`Closure check failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const maxDate = new Date().toISOString().split('T')[0];

  return (
    <div className="fade-in-up" style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
          <BarChart3 size={20} color="#6366f1" /> Advanced Collections Management
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Complete collection workflow with real-time due tracking and automatic loan closure
        </p>
      </div>

      {/* Role Access Warning */}
      {!hasCollectionAccess && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          <AlertTriangle size={16} />
          <div>
            <div style={{ fontWeight: 700 }}>Access Denied</div>
            <div style={{ fontSize: 12 }}>Only Admins and Collection Officers can access this page.</div>
          </div>
        </div>
      )}

      {hasCollectionAccess && (
        <>
          {/* Search Section */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Search size={16} color="#6366f1" />
              Search Customer / Loan
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter Customer Name, Phone, ID, or Loan ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  style={{ height: 44, fontSize: 14 }}
                />
              </div>
              <button 
                className="btn btn-primary" 
                onClick={handleSearch}
                disabled={searching || !searchTerm.trim()}
                style={{ height: 44, paddingLeft: 20, paddingRight: 20 }}
              >
                {searching ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    Search
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error/Success Messages */}
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

          {/* Search Results */}
          {searchResults.length > 1 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                Search Results ({searchResults.length} found)
              </div>
              
              <div style={{ display: 'grid', gap: 12 }}>
                {searchResults.map((loan) => (
                  <div
                    key={loan.loanId}
                    onClick={() => handleLoanSelect(loan)}
                    style={{
                      padding: 16,
                      border: '1px solid var(--bg-border)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: selectedLoan?.loanId === loan.loanId ? 'rgba(99,102,241,0.1)' : 'var(--bg-elevated)',
                      borderColor: selectedLoan?.loanId === loan.loanId ? '#6366f1' : 'var(--bg-border)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{loan.customerName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          Loan: {loan.loanId.slice(0, 12)}... • Pending: {loan.pendingInstallments}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>
                          ₹{(loan.totalRemainingAmount / 100).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Remaining Due
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Loan Details */}
          {selectedLoan && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 20 }}>
              {/* Main Content */}
              <div>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--bg-border)', paddingBottom: 12 }}>
                  {(['search', 'details', 'history'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        background: activeTab === tab ? '#6366f1' : 'transparent',
                        color: activeTab === tab ? 'white' : 'var(--text-muted)',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}
                    >
                      {tab === 'search' && <Search size={14} style={{ marginRight: 6 }} />}
                      {tab === 'details' && <Eye size={14} style={{ marginRight: 6 }} />}
                      {tab === 'history' && <History size={14} style={{ marginRight: 6 }} />}
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div className="card">
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <User size={16} color="#6366f1" />
                      Loan Details
                    </div>

                    {/* Customer Info */}
                    <div style={{ 
                      background: 'var(--bg-elevated)', 
                      padding: 16, 
                      borderRadius: 8, 
                      marginBottom: 16,
                      border: '1px solid var(--bg-border)'
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#6366f1' }}>
                        Customer & Loan Information
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Customer Name</div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedLoan.customerName}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Loan ID</div>
                          <div style={{ fontSize: 12, fontFamily: 'monospace' }}>{selectedLoan.loanId.slice(0, 16)}...</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total Loan Amount</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#6366f1' }}>
                            ₹{(selectedLoan.totalLoanAmount / 100).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total Receivable</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>
                            ₹{(selectedLoan.totalReceivable / 100).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div style={{ 
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(16,185,129,0.1) 100%)', 
                      padding: 16, 
                      borderRadius: 8, 
                      marginBottom: 16,
                      border: '1px solid rgba(99,102,241,0.2)'
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#6366f1' }}>
                        💰 Payment Summary
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total Paid</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>
                            ₹{(selectedLoan.totalPaidAmount / 100).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Remaining Due</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#ef4444' }}>
                            ₹{(selectedLoan.totalRemainingAmount / 100).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>This Month Due</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b' }}>
                            ₹{(selectedLoan.currentMonthDue / 100).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Overdue Amount</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#dc2626' }}>
                            ₹{(selectedLoan.overdueAmount / 100).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {selectedLoan.overdueInstallments > 0 && (
                        <div style={{ 
                          marginTop: 12, 
                          padding: 8, 
                          background: 'rgba(239, 68, 68, 0.1)', 
                          borderRadius: 6,
                          border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                          <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
                            ⚠️ {selectedLoan.overdueInstallments} installment(s) overdue
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Installment Summary */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Hash size={14} color="#6366f1" />
                        Installment Details
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <div className="card" style={{ padding: 12, textAlign: 'center', background: 'rgba(99,102,241,0.1)' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#6366f1' }}>
                            {selectedLoan.totalInstallments}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Total</div>
                        </div>
                        <div className="card" style={{ padding: 12, textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>
                            {selectedLoan.paidInstallments}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Completed</div>
                        </div>
                        <div className="card" style={{ padding: 12, textAlign: 'center', background: 'rgba(245, 158, 11, 0.1)' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b' }}>
                            {selectedLoan.pendingInstallments}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Pending</div>
                        </div>
                      </div>
                    </div>

                    {/* Closure Status */}
                    {closureStatus && (
                      <div style={{ 
                        background: closureStatus.isClosureEligible ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)', 
                        padding: 16, 
                        borderRadius: 8,
                        border: closureStatus.isClosureEligible ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(156, 163, 175, 0.3)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          {closureStatus.isClosureEligible ? (
                            <CheckCircle size={16} color="#10b981" />
                          ) : (
                            <Clock size={16} color="#9ca3af" />
                          )}
                          <div style={{ fontSize: 13, fontWeight: 700, color: closureStatus.isClosureEligible ? '#10b981' : '#9ca3af' }}>
                            {closureStatus.isClosureEligible ? 'Ready for Closure' : 'Closure Status'}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                          <div>
                            <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Collection %</div>
                            <div style={{ fontWeight: 700 }}>{closureStatus.collectionPercentage.toFixed(1)}%</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Status</div>
                            <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{closureStatus.currentStatus}</div>
                          </div>
                        </div>
                        {closureStatus.isClosureEligible && (
                          <button
                            onClick={handleAutoClose}
                            disabled={submitting}
                            style={{
                              marginTop: 12,
                              width: '100%',
                              padding: '8px 12px',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: 6,
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 600
                            }}
                          >
                            {submitting ? 'Processing...' : 'Auto-Close Loan'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Collection Form Sidebar */}
              <div className="card">
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={16} color="#6366f1" />
                  Record Collection
                </div>

                <form onSubmit={handleSubmitCollection}>
                  {/* Collection Date */}
                  <div style={{ marginBottom: 16 }}>
                    <div className="input-label">
                      <Calendar size={12} /> Collection Date *
                    </div>
                    <input
                      type="date"
                      className="input"
                      value={formData.collectionDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, collectionDate: e.target.value }))}
                      max={maxDate}
                      required
                    />
                  </div>

                  {/* Collection Amount */}
                  <div style={{ marginBottom: 16 }}>
                    <div className="input-label">
                      <DollarSign size={12} /> Amount (₹) *
                    </div>
                    <input
                      type="text"
                      className="input"
                      placeholder="Enter amount..."
                      value={formData.collectionAmount}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        setFormData(prev => ({ ...prev, collectionAmount: value }));
                      }}
                      required
                      style={{ fontSize: '16px', fontWeight: '600' }}
                    />
                    
                    {/* Quick Buttons */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {selectedLoan.currentMonthDue > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ 
                            fontSize: 10, 
                            padding: '4px 8px', 
                            background: 'rgba(245, 158, 11, 0.1)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.3)'
                          }}
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            collectionAmount: (selectedLoan.currentMonthDue / 100).toString() 
                          }))}
                        >
                          This Month
                        </button>
                      )}
                      {selectedLoan.overdueAmount > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ 
                            fontSize: 10, 
                            padding: '4px 8px', 
                            background: 'rgba(220, 38, 38, 0.1)',
                            color: '#dc2626',
                            border: '1px solid rgba(220, 38, 38, 0.3)'
                          }}
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            collectionAmount: (selectedLoan.overdueAmount / 100).toString() 
                          }))}
                        >
                          Overdue
                        </button>
                      )}
                      {selectedLoan.totalRemainingAmount > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ 
                            fontSize: 10, 
                            padding: '4px 8px', 
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.3)'
                          }}
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            collectionAmount: (selectedLoan.totalRemainingAmount / 100).toString() 
                          }))}
                        >
                          Full Payment
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Remarks */}
                  <div style={{ marginBottom: 20 }}>
                    <div className="input-label">Remarks (Optional)</div>
                    <textarea
                      className="input"
                      rows={3}
                      placeholder="Add remarks..."
                      value={formData.remarks}
                      onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    />
                  </div>

                  {/* Submit Button */}
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%', height: '48px', fontSize: '14px', fontWeight: '700' }}
                    disabled={submitting || !formData.collectionAmount || parseFloat(formData.collectionAmount) <= 0}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Recording...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Record Collection
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!selectedLoan && searchResults.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <TrendingUp size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Advanced Collections</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Search for customers to record collections and manage loan closures
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
