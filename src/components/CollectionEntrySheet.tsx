'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, User, Search, AlertTriangle, CheckCircle2, X, Loader2, FileText } from 'lucide-react';
import { collectionService, Installment } from '@/services/collectionService';
import { LoanCase } from '@/services/loanService';
import { useAuth } from '@/context/AuthContext';

interface CollectionEntrySheetProps {
  installments: Installment[];
  loans: Record<string, LoanCase>;
  onClose: () => void;
  onSuccess: () => void;
}

interface EntryFormData {
  selectedInstallment: Installment | null;
  collectionDate: string;
  collectionAmount: string;
  remarks: string;
}

const CollectionEntrySheet: React.FC<CollectionEntrySheetProps> = ({ 
  installments, 
  loans, 
  onClose, 
  onSuccess 
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<EntryFormData>({
    selectedInstallment: null,
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
    
    // Reset time to compare only dates
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
    // Only allow numbers and decimal point
    const numericValue = amount.replace(/[^0-9.]/g, '');
    setFormData(prev => ({ ...prev, collectionAmount: numericValue }));
  };

  const handleInstallmentSelect = (installment: Installment) => {
    setFormData(prev => ({ 
      ...prev, 
      selectedInstallment: installment,
      collectionAmount: (installment.amount / 100).toString() // Pre-fill with due amount
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasCollectionAccess) {
      setError('Insufficient permissions');
      return;
    }

    if (!formData.selectedInstallment) {
      setError('Please select a loan/installment');
      return;
    }

    if (!validateDate(formData.collectionDate)) {
      return;
    }

    if (!formData.collectionAmount || parseFloat(formData.collectionAmount) <= 0) {
      setError('Please enter a valid collection amount');
      return;
    }

    const collectionAmountPaise = Math.round(parseFloat(formData.collectionAmount) * 100);

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Use the existing backend endpoint: /api/Collection/collect
      const collectRequest = {
        installmentId: formData.selectedInstallment.id,
        amountPaid: collectionAmountPaise,
        mode: 'Cash', // Default to Cash for entry sheet
        utrRef: '', // Empty for cash payments
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
              <FileText size={18} color="#6366f1" />
              Collection Entry Sheet
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Record daily collection payments
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>
            <X size={18} />
          </button>
        </div>

        {/* Role Access Warning */}
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
            {/* Search and Select Installment */}
            <div style={{ marginBottom: 20 }}>
              <div className="input-label">
                <Search size={12} /> Search Loan / Customer *
              </div>
              <input
                type="text"
                className="input"
                placeholder="Search by customer name or loan ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={!hasCollectionAccess}
              />
            </div>

            {/* Installment Selection */}
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

            {/* Selected Installment Info */}
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
              {/* Collection Date */}
              <div>
                <div className="input-label">
                  <Calendar size={12} /> Collection Date *
                </div>
                <input
                  type="date"
                  className={`input ${dateError ? 'input-error' : ''}`}
                  value={formData.collectionDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  max={maxDate}
                  required
                  disabled={!hasCollectionAccess}
                />
                {dateError && (
                  <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={10} />
                    {dateError}
                  </div>
                )}
              </div>

              {/* Collection Amount */}
              <div>
                <div className="input-label">
                  <DollarSign size={12} /> Collection Amount (₹) *
                </div>
                <input
                  type="text"
                  className="input"
                  placeholder="0.00"
                  value={formData.collectionAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  required
                  disabled={!hasCollectionAccess}
                />
                {formData.selectedInstallment && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    Due: ₹{(formData.selectedInstallment.amount / 100).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* Remarks */}
            <div style={{ marginBottom: 20 }}>
              <div className="input-label">Remarks (Optional)</div>
              <textarea
                className="input"
                rows={3}
                placeholder="Additional notes about this collection..."
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                disabled={!hasCollectionAccess}
              />
            </div>

            {/* User Info */}
            <div style={{ 
              background: 'var(--bg-elevated)', 
              padding: 12, 
              borderRadius: 6, 
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <User size={14} color="var(--text-muted)" />
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Collected by: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user?.name} ({user?.role})
                </span>
              </div>
            </div>

            {/* Error/Success Messages */}
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

            {/* Action Buttons */}
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

        {/* Date Validation Info */}
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          background: 'rgba(99,102,241,0.08)', 
          borderRadius: 6,
          fontSize: 11,
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Calendar size={10} />
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

export default CollectionEntrySheet;