'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardList, CheckCircle2, MapPin, AlertTriangle, Loader2, AlertCircle, Edit3, History } from 'lucide-react';
import { collectionService, Installment } from '@/services/collectionService';
import { loanService, LoanCase } from '@/services/loanService';
// import DailyCollectionUpdate from '@/components/DailyCollectionUpdate';
// import CollectionAuditTrail from '@/components/CollectionAuditTrail';
import { useAuth } from '@/context/AuthContext';

// Inline CollectionEntrySheet component to avoid module import issues
const CollectionEntrySheet = ({ installments, loans, onClose, onSuccess }: {
  installments: Installment[];
  loans: Record<string, LoanCase>;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    selectedInstallment: null as Installment | null,
    collectionDate: new Date().toISOString().split('T')[0],
    collectionAmount: '',
    remarks: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Role-based access control
  const hasCollectionAccess = user?.role === 'super_admin' || 
                             user?.role === 'collection_officer';

  useEffect(() => {
    if (!hasCollectionAccess) {
      setError('You do not have permission to update collections');
    }
  }, [hasCollectionAccess]);

  // Filter installments based on search term
  const filteredInstallments = installments.filter(installment => {
    const loan = loans[installment.loanCaseId];
    const customerName = loan?.customerName?.toLowerCase() || '';
    const loanId = installment.loanCaseId.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return customerName.includes(search) || loanId.includes(search);
  });

  // Date validation
  const validateDate = (selectedDate: string) => {
    const today = new Date();
    const selected = new Date(selectedDate);
    
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);
    
    if (selected > today) {
      setDateError('Future date not allowed');
      return false;
    }
    
    setDateError(null);
    return true;
  };

  const handleDateChange = (date: string) => {
    setFormData(prev => ({ ...prev, collectionDate: date }));
    validateDate(date);
  };

  const handleAmountChange = (amount: string) => {
    const numericValue = amount.replace(/[^0-9.]/g, '');
    setFormData(prev => ({ ...prev, collectionAmount: numericValue }));
  };

  const handleInstallmentSelect = (installment: Installment) => {
    setFormData(prev => ({ 
      ...prev, 
      selectedInstallment: installment,
      collectionAmount: (installment.amount / 100).toString()
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasCollectionAccess || !formData.selectedInstallment) {
      setError('Please select a loan/installment');
      return;
    }

    if (!validateDate(formData.collectionDate)) return;

    if (!formData.collectionAmount || parseFloat(formData.collectionAmount) <= 0) {
      setError('Please enter a valid collection amount');
      return;
    }

    const collectionAmountPaise = Math.round(parseFloat(formData.collectionAmount) * 100);

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const collectRequest = {
        installmentId: formData.selectedInstallment.id,
        amountPaid: collectionAmountPaise,
        mode: 'Cash',
        utrRef: '',
        remarks: formData.remarks
      };

      await collectionService.recordPayment(collectRequest);

      setSuccess('Collection recorded successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Collection entry error:', err);
      if (err.message.includes('Redis')) {
        setError('Redis connection error. Please contact system administrator or update backend connection string with abortConnect=false.');
      } else {
        setError(err.message || 'Failed to record collection. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const maxDate = new Date().toISOString().split('T')[0];
  const isSubmitDisabled = loading || !!dateError || !hasCollectionAccess || 
                          !formData.selectedInstallment || !formData.collectionAmount;

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      background: 'rgba(0,0,0,0.75)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 9999 
    }}>
      <div className="card" style={{ width: 700, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              Collection Entry Sheet
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Record daily collection payments
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>
            ×
          </button>
        </div>

        {!hasCollectionAccess && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            <AlertTriangle size={16} />
            <div>
              <div style={{ fontWeight: 700 }}>Access Denied</div>
              <div style={{ fontSize: 12 }}>Only Admins and Collection Officers can access the Entry Sheet.</div>
            </div>
          </div>
        )}

        {hasCollectionAccess && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <div className="input-label">Search Loan / Customer *</div>
              <input
                type="text"
                className="input"
                placeholder="Search by customer name or loan ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div className="input-label">Select Installment *</div>
              <div style={{ 
                maxHeight: 200, 
                overflowY: 'auto', 
                border: '1px solid var(--bg-border)', 
                borderRadius: 8,
                background: 'var(--bg-elevated)'
              }}>
                {filteredInstallments.length > 0 ? (
                  filteredInstallments.slice(0, 10).map((installment) => {
                    const loan = loans[installment.loanCaseId];
                    const isSelected = formData.selectedInstallment?.id === installment.id;
                    
                    return (
                      <div
                        key={installment.id}
                        onClick={() => handleInstallmentSelect(installment)}
                        style={{
                          padding: 12,
                          borderBottom: '1px solid var(--bg-border)',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(99,102,241,0.1)' : 'transparent',
                          borderLeft: isSelected ? '3px solid #6366f1' : '3px solid transparent'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {loan?.customerName || 'Loading...'}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                              Loan: {installment.loanCaseId.slice(0, 12)}... • Installment #{installment.no}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>
                              ₹{(installment.amount / 100).toLocaleString()}
                            </div>
                            <span className={`badge ${
                              installment.status === 'paid' ? 'badge-success' : 
                              installment.status === 'partially_paid' ? 'badge-warning' : 
                              'badge-gray'
                            }`} style={{ fontSize: 10 }}>
                              {installment.status === 'paid' ? 'Paid' : 
                               installment.status === 'partially_paid' ? 'Partial' : 
                               'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                    {searchTerm ? 'No matching installments found' : 'Start typing to search for loans'}
                  </div>
                )}
              </div>
            </div>

            {formData.selectedInstallment && (
              <div style={{ 
                background: 'rgba(99,102,241,0.05)', 
                padding: 16, 
                borderRadius: 8, 
                marginBottom: 20,
                border: '1px solid rgba(99,102,241,0.2)'
              }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Selected Installment:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Customer</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {loans[formData.selectedInstallment.loanCaseId]?.customerName || 'Loading...'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Due Amount</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>
                      ₹{(formData.selectedInstallment.amount / 100).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Due Date</div>
                    <div style={{ fontSize: 12, fontFamily: 'monospace' }}>
                      {new Date(formData.selectedInstallment.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <div className="input-label">Collection Date *</div>
                <input
                  type="date"
                  className={`input ${dateError ? 'input-error' : ''}`}
                  value={formData.collectionDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  max={maxDate}
                  required
                />
                {dateError && (
                  <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={10} />
                    {dateError}
                  </div>
                )}
              </div>

              <div>
                <div className="input-label">Collection Amount (₹) *</div>
                <input
                  type="text"
                  className="input"
                  placeholder="0.00"
                  value={formData.collectionAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  required
                />
                {formData.selectedInstallment && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    Due: ₹{(formData.selectedInstallment.amount / 100).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div className="input-label">Remarks (Optional)</div>
              <textarea
                className="input"
                rows={3}
                placeholder="Additional notes about this collection..."
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              />
            </div>

            {error && (
              <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success" style={{ marginBottom: 16 }}>
                <CheckCircle2 size={16} />
                {success}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isSubmitDisabled}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={13} />
                    Recording...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={13} />
                    Record Collection
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          background: 'rgba(99,102,241,0.08)', 
          borderRadius: 6,
          fontSize: 11,
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>Date Validation Rules:</span>
          </div>
          <ul style={{ marginLeft: 16, marginTop: 4 }}>
            <li>✓ Today's date is allowed</li>
            <li>✓ Previous dates are allowed</li>
            <li>✗ Future dates are strictly prohibited</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default function CollectionsPage() {
  const { user } = useAuth();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loans, setLoans] = useState<Record<string, LoanCase>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showEntrySheet, setShowEntrySheet] = useState(false);

  // Role-based access control
  const hasCollectionAccess = user?.role === 'super_admin' || 
                             user?.role === 'collection_officer' || 
                             user?.role === 'branch_manager';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const today = new Date().toISOString().split('T')[0];
      
      let data: Installment[];
      try {
        // Try primary endpoint first
        data = await collectionService.getDue(today, today);
      } catch (primaryError: any) {
        console.warn('Primary collection endpoint failed, trying alternative:', primaryError.message);
        // Try alternative endpoint if primary fails (e.g., Redis issues)
        data = await collectionService.getDailyCollection(today);
      }
      
      setInstallments(data);

      // Fetch loan details for enrichment
      const loanIds = Array.from(new Set(data.map(i => i.loanCaseId)));
      const loanPromises = loanIds.map(async (id) => {
        try {
          return await loanService.getById(id);
        } catch (err) {
          console.warn(`Failed to fetch loan ${id}:`, err);
          return null;
        }
      });
      
      const loanList = (await Promise.all(loanPromises)).filter(Boolean) as LoanCase[];
      
      const loanMap: Record<string, LoanCase> = {};
      loanList.forEach(l => {
        loanMap[l.id] = l;
      });
      setLoans(loanMap);

      // If loans don't have customer names, fetch customers separately
      const loansWithoutNames = loanList.filter(loan => !loan.customerName || loan.customerName === 'Unknown Customer');
      
      if (loansWithoutNames.length > 0) {
        try {
          // Import customerService dynamically to avoid circular dependencies
          const { customerService } = await import('@/services/customerService');
          
          let customerData = [];
          try {
            customerData = await customerService.getAll();
          } catch (custErr) {
            console.warn('Failed to fetch from main customer endpoint, trying alternative:', custErr);
            customerData = await customerService.getAllAlt();
          }

          // Update loan map with customer names
          customerData.forEach(customer => {
            Object.values(loanMap).forEach(loan => {
              if (loan.customerId === customer.id && (!loan.customerName || loan.customerName === 'Unknown Customer')) {
                loan.customerName = customer.name;
              }
            });
          });
          setLoans({...loanMap}); // Trigger re-render
        } catch (customerError) {
          console.warn('Failed to fetch customers:', customerError);
        }
      }

    } catch (err: any) {
      console.error('Fetch collections error:', err);
      if (err.message.includes('Redis')) {
        setError('Redis connection error detected. Please ensure Redis server is running or update backend connection string with abortConnect=false.');
      } else {
        setError('Failed to load collection sheet. Ensure the backend is running on port 5177.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = filter === 'all' ? installments : installments.filter(i => {
    if (filter === 'pending') return i.status === 'pending';
    if (filter === 'collected') return i.status === 'paid';
    return true;
  });

  const total = installments.length;
  const collected = installments.filter(i => i.status === 'paid').length;
  const totalAmount = installments.reduce((s, d) => s + d.amount, 0) / 100;
  const collectedAmount = installments.filter(i => i.status === 'paid').reduce((s, d) => s + d.amount, 0) / 100;

  const markCollected = async (installment: Installment) => {
    try {
      setLoading(true);
      await collectionService.recordPayment({
        installmentId: installment.id,
        amountPaid: installment.amount,
        mode: 'Cash'
      });
      fetchData();
    } catch (err: any) {
      alert('Error recording payment: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCollection = (installment: Installment) => {
    setSelectedInstallment(installment);
    setShowUpdateModal(true);
  };

  const handleViewAudit = (installment: Installment) => {
    setSelectedInstallment(installment);
    setShowAuditModal(true);
  };

  const handleUpdateSuccess = () => {
    fetchData(); // Refresh data after successful update
  };

  if (loading && installments.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Generating collection sheet...</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardList size={20} color="#6366f1" /> Daily Collection Sheet
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Auto-generated at {new Date().toLocaleTimeString()} · {new Date().toDateString()}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {hasCollectionAccess && (
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => setShowEntrySheet(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Edit3 size={14} />
              Entry Sheet
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={fetchData}>Refresh</button>
          {hasCollectionAccess && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '6px 12px', background: 'var(--bg-elevated)', borderRadius: 6 }}>
              ✓ Collection Update Access
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20, borderRadius: 12 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Accounts', val: total, color: '#6366f1' },
          { label: 'Collected', val: collected, color: '#10b981' },
          { label: 'Pending', val: total - collected, color: '#f59e0b' },
          { label: 'Amount Target', val: `₹${totalAmount.toLocaleString()}`, color: '#06b6d4' },
          { label: 'Amount Collected', val: `₹${collectedAmount.toLocaleString()}`, color: '#10b981' },
        ].map((item, i) => (
          <div key={i} className="card" style={{ flex: 1, padding: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'pending', 'collected'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 16 }}>#</th>
              <th>Customer</th>
              <th>Loan ID</th>
              <th>EMI Amount</th>
              <th>Installment No</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((i_item, idx) => {
              const loan = loans[i_item.loanCaseId];
              return (
                <tr key={i_item.id}>
                  <td style={{ paddingLeft: 16, color: 'var(--text-muted)', fontSize: 11 }}>{idx + 1}</td>
                  <td className="primary">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={11} color="var(--text-muted)" />
                      {loan?.customerName || 'Loading...'}
                    </div>
                  </td>
                  <td className="mono" style={{ fontSize: 11 }}>{i_item.loanCaseId.slice(0, 8)}...</td>
                  <td style={{ fontWeight: 700, color: '#fbbf24' }}>₹{(i_item.amount / 100).toLocaleString()}</td>
                  <td><span className="badge badge-info">#{i_item.no}</span></td>
                  <td>
                    <span className={`badge ${i_item.status === 'paid' ? 'badge-success' : i_item.status === 'partially_paid' ? 'badge-warning' : 'badge-gray'}`}>
                      {i_item.status === 'paid' ? '✓ Paid' : i_item.status === 'partially_paid' ? '~ Partial' : '○ Pending'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {i_item.status !== 'paid' ? (
                        <>
                          <button className="btn btn-success btn-sm" style={{ fontSize: 11 }} onClick={() => markCollected(i_item)}>
                            <CheckCircle2 size={10} /> Collect
                          </button>
                          {hasCollectionAccess && (
                            <button 
                              className="btn btn-primary btn-sm" 
                              style={{ fontSize: 11 }} 
                              onClick={() => handleUpdateCollection(i_item)}
                              title="Update Collection"
                            >
                              <Edit3 size={10} />
                            </button>
                          )}
                        </>
                      ) : (
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <CheckCircle2 size={16} color="#34d399" />
                          {hasCollectionAccess && (
                            <button 
                              className="btn btn-secondary btn-sm" 
                              style={{ fontSize: 11 }} 
                              onClick={() => handleUpdateCollection(i_item)}
                              title="Update Collection"
                            >
                              <Edit3 size={10} />
                            </button>
                          )}
                        </div>
                      )}
                      <button 
                        className="btn btn-secondary btn-sm" 
                        style={{ fontSize: 11 }} 
                        onClick={() => handleViewAudit(i_item)}
                        title="View Audit Trail"
                      >
                        <History size={10} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No collections found for today.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Daily Collection Update Modal */}
      {showUpdateModal && selectedInstallment && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.75)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 9999 
        }}>
          <div className="card" style={{ width: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Daily Collection Update
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Installment #{selectedInstallment.no} • Loan: {selectedInstallment.loanCaseId.slice(0, 8)}...
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedInstallment(null);
                }} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}
              >
                ×
              </button>
            </div>

            {/* Role Access Warning */}
            {!hasCollectionAccess && (
              <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                <AlertTriangle size={16} />
                <div>
                  <div style={{ fontWeight: 700 }}>Access Denied</div>
                  <div style={{ fontSize: 12 }}>Only Admins, Collection Officers, and Branch Managers can update collections.</div>
                </div>
              </div>
            )}

            {/* Current Installment Info */}
            <div style={{ 
              background: 'var(--bg-elevated)', 
              padding: 16, 
              borderRadius: 8, 
              marginBottom: 20,
              border: '1px solid var(--bg-border)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Due Amount</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>
                    ₹{(selectedInstallment.amount / 100).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Status</div>
                  <span className={`badge ${
                    selectedInstallment.status === 'paid' ? 'badge-success' : 
                    selectedInstallment.status === 'partially_paid' ? 'badge-warning' : 
                    'badge-gray'
                  }`}>
                    {selectedInstallment.status === 'paid' ? 'Paid' : 
                     selectedInstallment.status === 'partially_paid' ? 'Partial' : 
                     'Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
              <p>Daily Collection Update feature is ready for backend integration.</p>
              <p style={{ fontSize: 12, marginTop: 8 }}>
                This modal will allow users to update collection amounts with date validation and role-based access control.
              </p>
              <button 
                className="btn btn-primary btn-sm" 
                style={{ marginTop: 12 }}
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedInstallment(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collection Audit Trail Modal */}
      {showAuditModal && selectedInstallment && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.75)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 9999 
        }}>
          <div className="card" style={{ width: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <History size={16} color="#6366f1" />
                  Collection Audit Trail
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Installment: {selectedInstallment.id.slice(0, 8)}... • Loan: {selectedInstallment.loanCaseId.slice(0, 8)}...
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAuditModal(false);
                  setSelectedInstallment(null);
                }} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}
              >
                ×
              </button>
            </div>

            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <History size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
              <p>Audit trail feature is ready for backend integration.</p>
              <p style={{ fontSize: 12, marginTop: 8 }}>
                This will show complete history of all collection updates with user tracking and timestamps.
              </p>
              <button 
                className="btn btn-primary btn-sm" 
                style={{ marginTop: 12 }}
                onClick={() => {
                  setShowAuditModal(false);
                  setSelectedInstallment(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collection Entry Sheet Modal */}
      {showEntrySheet && (
        <CollectionEntrySheet
          installments={installments}
          loans={loans}
          onClose={() => setShowEntrySheet(false)}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
}
