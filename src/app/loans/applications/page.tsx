'use client';
import React, { useState, useEffect } from 'react';
import { Plus, User, FileText, CheckCircle2, XCircle, Clock, Eye, AlertTriangle, Loader2 } from 'lucide-react';
import { getStatusColor } from '@/lib/utils';
import { loanService, LoanCase } from '@/services/loanService';
import { customerService, Customer } from '@/services/customerService';
import { productService, LoanProduct } from '@/services/productService';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<LoanCase[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittingForApproval, setSubmittingForApproval] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Form state for new application
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    aadhaar: '',
    pan: '',
    principal: '',
    interestAmount: '',
    processingFees: '',
  });

  const selectedApp = applications.find(a => a.id === selected);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [loansData, customersData, productsData] = await Promise.all([
        loanService.getAll(),
        customerService.getAll(),
        productService.getAll(),
      ]);
      setApplications(loansData);
      setCustomers(customersData);
      setProducts(productsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await loanService.approve(id);
      await loadData(); // Refresh data
      alert('Loan approved successfully!');
    } catch (err: any) {
      alert(`Failed to approve loan: ${err.message}`);
    }
  };

  const handleDisburse = async (id: string) => {
    try {
      await loanService.disburse(id);
      await loadData(); // Refresh data
      alert('Loan disbursed successfully!');
    } catch (err: any) {
      alert(`Failed to disburse loan: ${err.message}`);
    }
  };

  /**
   * PHASE 3: Submit loan for approval
   * Changes status from DRAFT to PENDING_APPROVAL
   */
  const handleSubmitForApproval = async () => {
    if (!selectedApp) return;
    
    try {
      setSubmittingForApproval(true);
      await loanService.submitLoanForApproval(selectedApp.id);
      setShowSubmitDialog(false);
      alert('Loan submitted for approval successfully! Admin will review your application.');
      await loadData(); // Refresh data
      setSelected(null);
    } catch (err: any) {
      alert(`Failed to submit for approval: ${err.message}`);
    } finally {
      setSubmittingForApproval(false);
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.phone || !formData.aadhaar || !formData.pan || !formData.principal) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      // First create customer
      const customer = await customerService.create({
        name: formData.customerName,
        phone: formData.phone || '0000000000', // Add required phone field
        aadhaarEncrypted: formData.aadhaar,
        panEncrypted: formData.pan,
      });

      // Then create loan case
      await loanService.create({
        customerId: customer.id,
        principal: parseInt(formData.principal) * 100, // Convert to paise
        interestAmount: parseInt(formData.interestAmount || '0') * 100,
        processingFees: parseInt(formData.processingFees || '0') * 100,
      });

      alert('Application submitted successfully!');
      setShowNew(false);
      setFormData({
        customerName: '',
        phone: '',
        aadhaar: '',
        pan: '',
        principal: '',
        interestAmount: '',
        processingFees: '',
      });
      await loadData(); // Refresh data
    } catch (err: any) {
      alert(`Failed to submit application: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fade-in-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <Loader2 className="animate-spin" size={32} />
        <span style={{ marginLeft: 12 }}>Loading applications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in-up">
        <div className="alert alert-danger">
          <AlertTriangle size={16} />
          Error loading applications: {error}
          <button className="btn btn-secondary btn-sm" onClick={loadData} style={{ marginLeft: 12 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Loan Applications</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Manage loan cases and applications</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}><Plus size={13} /> New Application</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Applications', val: applications.length, color: '#6366f1' },
          { label: 'Pending Review', val: applications.filter(a => a.status === 'draft').length, color: '#f59e0b' },
          { label: 'Active Loans', val: applications.filter(a => a.status === 'active').length, color: '#10b981' },
          { label: 'Closed', val: applications.filter(a => a.status === 'closed').length, color: '#6b7280' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ flex: 1, padding: 16 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedApp ? '1fr 420px' : '1fr', gap: 16 }}>
        {/* Applications Table */}
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 16, paddingTop: 14, paddingBottom: 14 }}>Loan Code</th>
                <th>Customer</th>
                <th>Principal</th>
                <th>Total Receivable</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr key={app.id} onClick={() => setSelected(app.id)} style={{ cursor: 'pointer', background: selected === app.id ? 'rgba(99,102,241,0.08)' : '' }}>
                  <td className="primary mono" style={{ paddingLeft: 16 }}>{app.loanCode || 'N/A'}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{app.customerName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Customer Code: {app.customerCode || 'N/A'}</div>
                  </td>
                  <td style={{ fontWeight: 700 }}>₹{(app.principal / 100).toLocaleString()}</td>
                  <td style={{ fontWeight: 700 }}>₹{(app.totalReceivable / 100).toLocaleString()}</td>
                  <td><span className={`badge ${getStatusColor(app.status)}`}>{app.status}</span></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelected(app.id)}><Eye size={12} /></button>
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    No loan applications found. Create your first application.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Application Detail Panel */}
        {selectedApp && (
          <div>
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Loan Details</div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Loan Code', val: selectedApp.loanCode || 'N/A' },
                  { label: 'Customer', val: selectedApp.customerName },
                  { label: 'Customer Code', val: selectedApp.customerCode || 'N/A' },
                  { label: 'Principal Amount', val: `₹${(selectedApp.principal / 100).toLocaleString()}` },
                  { label: 'Interest Amount', val: `₹${(selectedApp.interestAmount / 100).toLocaleString()}` },
                  { label: 'Total Receivable', val: `₹${(selectedApp.totalReceivable / 100).toLocaleString()}` },
                  { label: 'Status', val: selectedApp.status },
                  { label: 'Created At', val: selectedApp.createdAt ? new Date(selectedApp.createdAt).toLocaleDateString() : 'N/A' },
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bg-border)' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{f.val}</span>
                  </div>
                ))}
              </div>

              {/* Action buttons based on status */}
              {selectedApp.status === 'draft' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexDirection: 'column' }}>
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%' }} 
                    onClick={() => setShowSubmitDialog(true)}
                    disabled={submittingForApproval}
                  >
                    {submittingForApproval ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    Submit for Approval
                  </button>
                  <button className="btn btn-success" style={{ width: '100%' }} onClick={() => handleApprove(selectedApp.id)}>
                    <CheckCircle2 size={13} /> Approve Directly (Admin Only)
                  </button>
                </div>
              )}

              {selectedApp.status === 'pending_disburse' && (
                <div style={{ marginTop: 14 }}>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleDisburse(selectedApp.id)}>
                    💸 Disburse Loan
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Application Modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: 580, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>New Loan Application</div>
            <form onSubmit={handleSubmitApplication}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="input-label">Customer Full Name *</div>
                  <input 
                    className="input" 
                    type="text" 
                    placeholder="As per Aadhaar"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <div className="input-label">Phone Number *</div>
                  <input 
                    className="input" 
                    type="tel" 
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <div className="input-label">Aadhaar Number *</div>
                  <input 
                    className="input" 
                    type="text" 
                    placeholder="12-digit number"
                    value={formData.aadhaar}
                    onChange={(e) => setFormData({...formData, aadhaar: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <div className="input-label">PAN Number *</div>
                  <input 
                    className="input" 
                    type="text" 
                    placeholder="ABCDE1234F"
                    value={formData.pan}
                    onChange={(e) => setFormData({...formData, pan: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <div className="input-label">Principal Amount (₹) *</div>
                  <input 
                    className="input" 
                    type="number" 
                    placeholder="e.g. 50000"
                    value={formData.principal}
                    onChange={(e) => setFormData({...formData, principal: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <div className="input-label">Interest Amount (₹)</div>
                  <input 
                    className="input" 
                    type="number" 
                    placeholder="e.g. 5000"
                    value={formData.interestAmount}
                    onChange={(e) => setFormData({...formData, interestAmount: e.target.value})}
                  />
                </div>
                <div>
                  <div className="input-label">Processing Fees (₹)</div>
                  <input 
                    className="input" 
                    type="number" 
                    placeholder="e.g. 500"
                    value={formData.processingFees}
                    onChange={(e) => setFormData({...formData, processingFees: e.target.value})}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNew(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" size={13} /> : <FileText size={13} />}
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHASE 3: Submit for Approval Dialog */}
      {showSubmitDialog && selectedApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div className="card" style={{ width: 420 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Submit Loan for Approval</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
              You are about to submit <strong>{selectedApp.loanCode}</strong> (₹{(selectedApp.totalReceivable / 100).toLocaleString()}) for admin approval.
            </p>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
              ℹ️ Once submitted, an administrator will review your application and either approve or reject it. You'll be notified of the decision.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowSubmitDialog(false)}
                disabled={submittingForApproval}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmitForApproval}
                disabled={submittingForApproval}
              >
                {submittingForApproval ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                Submit for Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}