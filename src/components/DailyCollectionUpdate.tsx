'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, User, Clock, AlertTriangle, CheckCircle2, X, Loader2 } from 'lucide-react';
import { collectionService, Installment, CollectionUpdateRequest } from '@/services/collectionService';
import { useAuth } from '@/context/AuthContext';

interface DailyCollectionUpdateProps {
  installment: Installment;
  onClose: () => void;
  onSuccess: () => void;
}

const DailyCollectionUpdate: React.FC<DailyCollectionUpdateProps> = ({ installment, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    collectionDate: new Date().toISOString().split('T')[0],
    collectionAmount: '',
    mode: 'cash' as 'cash' | 'upi' | 'bank_transfer' | 'cheque',
    utrRef: '',
    remarks: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  // Role-based access control
  const hasCollectionAccess = user?.role === 'super_admin' || 
                             user?.role === 'collection_officer' || 
                             user?.role === 'branch_manager';

  useEffect(() => {
    if (!hasCollectionAccess) {
      setError('You do not have permission to update collections');
    }
  }, [hasCollectionAccess]);

  // Date validation
  const validateDate = (selectedDate: string) => {
    const today = new Date();
    const selected = new Date(selectedDate);
    
    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);
    
    if (selected > today) {
      setDateError('Cannot update collection for future dates');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasCollectionAccess) {
      setError('Insufficient permissions');
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
    
    if (collectionAmountPaise > installment.amount) {
      setError(`Collection amount cannot exceed installment amount of ₹${(installment.amount / 100).toLocaleString()}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // First validate with backend
      const validation = await collectionService.validateCollectionUpdate(
        formData.collectionDate, 
        user?.role || ''
      );

      if (!validation.allowed) {
        setError(validation.reason || 'Collection update not allowed');
        return;
      }

      // Prepare update request
      const updateRequest: CollectionUpdateRequest = {
        installmentId: installment.id,
        loanCaseId: installment.loanCaseId,
        collectionAmount: collectionAmountPaise,
        collectionDate: formData.collectionDate,
        mode: formData.mode,
        utrRef: formData.utrRef || undefined,
        remarks: formData.remarks || undefined,
        collectedBy: user?.id || user?.name,
        userRole: user?.role
      };

      // Update collection
      const response = await collectionService.updateDailyCollection(updateRequest);

      if (response.success) {
        setSuccess(response.message || 'Collection updated successfully');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(response.message || 'Failed to update collection');
      }

    } catch (err: any) {
      console.error('Collection update error:', err);
      setError(err.message || 'Failed to update collection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const maxDate = new Date().toISOString().split('T')[0];
  const isSubmitDisabled = loading || !!dateError || !hasCollectionAccess || !formData.collectionAmount;

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
      <div className="card" style={{ width: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={16} color="#6366f1" />
              Update Daily Collection
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Installment #{installment.no} • Loan: {installment.loanCaseId.slice(0, 8)}...
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
                ₹{(installment.amount / 100).toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Status</div>
              <span className={`badge ${
                installment.status === 'paid' ? 'badge-success' : 
                installment.status === 'partially_paid' ? 'badge-warning' : 
                'badge-gray'
              }`}>
                {installment.status === 'paid' ? 'Paid' : 
                 installment.status === 'partially_paid' ? 'Partial' : 
                 'Pending'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Due Date</div>
              <div style={{ fontSize: 12, fontFamily: 'monospace' }}>
                {new Date(installment.dueDate).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Collected</div>
              <div style={{ fontSize: 12, color: '#10b981' }}>
                ₹{((installment.collectedAmount || 0) / 100).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
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
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                Max: ₹{(installment.amount / 100).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            {/* Payment Mode */}
            <div>
              <div className="input-label">Payment Mode *</div>
              <select
                className="input"
                value={formData.mode}
                onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value as 'cash' | 'upi' | 'bank_transfer' | 'cheque' }))}
                required
                disabled={!hasCollectionAccess}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            {/* UTR Reference (for digital payments) */}
            {(formData.mode === 'upi' || formData.mode === 'bank_transfer') && (
              <div>
                <div className="input-label">UTR Reference</div>
                <input
                  type="text"
                  className="input"
                  placeholder="Transaction reference"
                  value={formData.utrRef}
                  onChange={(e) => setFormData(prev => ({ ...prev, utrRef: e.target.value }))}
                  disabled={!hasCollectionAccess}
                />
              </div>
            )}
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
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} />
                  Update Collection
                </>
              )}
            </button>
          </div>
        </form>

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
            <Clock size={10} />
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

export default DailyCollectionUpdate;