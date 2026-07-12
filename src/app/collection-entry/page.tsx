'use client';

import React, { useState } from 'react';
import { Search, FileText, User, Calendar, DollarSign, CheckCircle2, AlertTriangle, Loader2, CreditCard, Clock, TrendingUp, Hash, CheckCircle, Download, Printer } from 'lucide-react';
import { collectionService, LoanInstallmentSummary, CollectionEntryRequest } from '@/services/collectionService';
import { useAuth } from '@/context/AuthContext';
import { collectionRequestService } from '@/services/collectionRequestService';
import { downloadReceiptAsPDF, printReceipt, UniversalReceiptData } from '@/utils/receiptPdfGenerator';

export default function CollectionEntryPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<LoanInstallmentSummary[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanInstallmentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<UniversalReceiptData | null>(null);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'branch_manager';

  // Form data
  const [formData, setFormData] = useState({
    collectionAmount: '',
    remarks: '',
    collectionDate: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash',
    utrRef: '',
    directEntry: true
  });

  // Role-based access control - Admin and Collection Agent
  const hasCollectionAccess = user?.role === 'super_admin' || user?.role === 'branch_manager' || user?.role === 'collection_officer' || user?.role === 'agent';

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

    console.log('🔍 Starting search for:', searchTerm);
    console.log('🔍 Search term type detection:', {
      original: searchTerm,
      trimmed: searchTerm.trim(),
      isLoanIdPattern: /^[A-Za-z0-9-]+$/.test(searchTerm.trim()),
      containsSpaces: searchTerm.includes(' '),
      length: searchTerm.length
    });
    
    setSearching(true);
    setError(null);
    setSearchResults([]);
    setSelectedLoan(null);

    try {
      const results = await collectionService.searchLoanByCustomer(searchTerm);
      console.log('🎯 Search results:', results);

      if (results.length === 0) {
        // Provide more specific error messages based on search type
        const isLoanIdSearch = searchTerm.match(/^[A-Za-z0-9-]+$/);
        if (isLoanIdSearch) {
          setError(`No loan found with ID "${searchTerm}". Please verify the Loan ID is correct and exists in the system.`);
        } else {
          setError(`No customer found matching "${searchTerm}". Please check the customer name, phone number, or customer ID.`);
        }
      } else {
        setSearchResults(results);
        if (results.length === 1) {
          console.log('📋 Auto-selecting single result:', results[0]);
          setSelectedLoan(results[0]);
        }
        console.log('✅ Search completed successfully');
      }
    } catch (err: any) {
      console.error('❌ Search error:', err);
      setError(`Search failed: ${err.message}. Please check if the backend is running on port 5177.`);
    } finally {
      setSearching(false);
    }
  };

  const handleLoanSelect = (loan: LoanInstallmentSummary) => {
    setSelectedLoan(loan);
    // Pre-fill with current month due if available, otherwise next due amount
    const suggestedAmount = loan.currentMonthDue > 0 ? loan.currentMonthDue : loan.nextDueAmount;
    setFormData({
      collectionAmount: (suggestedAmount / 100).toString(),
      remarks: '',
      collectionDate: new Date().toISOString().split('T')[0],
      paymentMode: 'Cash',
      utrRef: '',
      directEntry: isAdmin
    });
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
      const collectionAmount = Math.round(parseFloat(formData.collectionAmount) * 100); // Convert to paise
      const isDirect = isAdmin && formData.directEntry;

      if (isDirect) {
        // Direct collection entry flow (immediate updates, for admins only)
        const request: CollectionEntryRequest = {
          loanId: selectedLoan.loanId,
          customerId: selectedLoan.customerId,
          amount: collectionAmount,
          remarks: formData.remarks,
          collectionDate: formData.collectionDate,
          paymentMode: formData.paymentMode,
          utrRef: formData.utrRef
        };

        console.log('📤 Submitting direct collection entry:', request);
        const response = await collectionService.submitCollectionEntry(request);

        if (response.success) {
          setSuccess(`✅ Collection recorded successfully! ${response.receiptId ? `Receipt: ${response.receiptId}` : ''}`);
          
          // Prepare receipt data for PDF generation
          const receiptInfo: UniversalReceiptData = {
            receiptNumber: response.receiptId || `RCP${Date.now().toString().slice(-6)}`,
            receiptDate: formData.collectionDate || new Date().toISOString(),
            customerName: selectedLoan.customerName,
            customerCode: selectedLoan.customerId.substring(0, 8),
            customerPhone: '', // Phone not available in LoanInstallmentSummary
            loanCode: selectedLoan.loanId.substring(0, 8),
            loanAmount: selectedLoan.totalReceivable,
            paidBefore: selectedLoan.totalPaidAmount,
            todaysPayment: collectionAmount,
            totalPaid: selectedLoan.totalPaidAmount + collectionAmount,
            outstanding: selectedLoan.totalRemainingAmount - collectionAmount,
            paymentMode: formData.paymentMode,
            utrRef: formData.utrRef,
            remarks: formData.remarks,
            collectionDate: formData.collectionDate,
            collectedBy: user?.name || 'System'
          };
          setReceiptData(receiptInfo);
          
          // Refresh the loan data to show updated installment status
          setTimeout(async () => {
            try {
              console.log('🔄 Refreshing loan data...');
              const updatedResults = await collectionService.searchLoanByCustomer(searchTerm);
              const updatedLoan = updatedResults.find(loan => loan.loanId === selectedLoan.loanId);
              if (updatedLoan) {
                setSelectedLoan(updatedLoan as LoanInstallmentSummary);
                setSearchResults(updatedResults as LoanInstallmentSummary[]);
                console.log('✅ Loan data refreshed');
              }
            } catch (refreshError) {
              console.warn('⚠️ Failed to refresh loan data:', refreshError);
            }
          }, 1500);

          // Clear form but keep context
          setFormData({
            collectionAmount: '',
            remarks: '',
            collectionDate: new Date().toISOString().split('T')[0],
            paymentMode: 'Cash',
            utrRef: '',
            directEntry: isAdmin
          });
        } else {
          setError(response.message || 'Failed to record collection');
        }
      } else {
        // Workflow-based pending approval request flow (for agents, and admins when directEntry is false)
        // Get installments for this loan to distribute payment
        const installments = await collectionService.getInstallmentsByLoan(selectedLoan.loanId);
        const pendingInstallments = installments
          .filter(inst => inst.status === 'pending')
          .sort((a, b) => a.no - b.no);

        if (pendingInstallments.length === 0) {
          throw new Error('No pending installments found for this loan');
        }

        let remainingAmount = collectionAmount;
        const requestsToSubmit = [];

        for (const installment of pendingInstallments) {
          if (remainingAmount <= 0) break;
          const paymentAmount = Math.min(remainingAmount, installment.amount);
          requestsToSubmit.push({
            installmentId: installment.id,
            amountPaid: paymentAmount,
            mode: formData.paymentMode,
            utrRef: formData.utrRef,
            remarks: formData.remarks
          });
          remainingAmount -= paymentAmount;
        }

        let successCount = 0;
        let reqNumbers: string[] = [];

        for (const req of requestsToSubmit) {
          console.log('📤 Submitting collection request for approval:', req);
          const res = await collectionRequestService.createRequest(req);
          if (res.success && res.data) {
            successCount++;
            reqNumbers.push(res.data.requestNumber);
          }
        }

        if (successCount > 0) {
          setSuccess(`✅ Collection request(s) submitted for approval! Request No(s): ${reqNumbers.join(', ')}. Status: Pending Approval.`);
          
          // Refresh the loan data (which won't change immediately since requests are pending, but good practice)
          setTimeout(async () => {
            try {
              const updatedResults = await collectionService.searchLoanByCustomer(searchTerm);
              const updatedLoan = updatedResults.find(loan => loan.loanId === selectedLoan.loanId);
              if (updatedLoan) {
                setSelectedLoan(updatedLoan as LoanInstallmentSummary);
                setSearchResults(updatedResults as LoanInstallmentSummary[]);
              }
            } catch (refreshError) {
              console.warn('Failed to refresh data:', refreshError);
            }
          }, 1500);

          // Clear form
          setFormData({
            collectionAmount: '',
            remarks: '',
            collectionDate: new Date().toISOString().split('T')[0],
            paymentMode: 'Cash',
            utrRef: '',
            directEntry: isAdmin
          });
        } else {
          throw new Error('Failed to submit collection request(s) for approval.');
        }
      }
    } catch (err: any) {
      console.error('❌ Collection submission error:', err);
      
      // Provide specific error messages
      if (err.message.includes('404')) {
        setError('Backend API endpoint not found. Please check if the backend is running correctly.');
      } else if (err.message.includes('Failed to record any payments')) {
        setError('Could not record payment. Please verify the backend API is configured correctly.');
      } else {
        setError(err.message || 'Failed to process collection. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const maxDate = new Date().toISOString().split('T')[0];

  return (
    <div className="fade-in-up" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={20} color="#6366f1" /> Collection Entry Sheet
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Search for customers and record collection payments with detailed installment tracking
        </p>
      </div>

      {/* Role Access Warning */}
      {!hasCollectionAccess && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          <AlertTriangle size={16} />
          <div>
            <div style={{ fontWeight: 700 }}>Access Denied</div>
            <div style={{ fontSize: 12 }}>Only Admins and Collection Agents can access the Collection Entry Sheet.</div>
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
                  placeholder="Enter Customer Code (CUS00001), Customer Name, or Loan Code (LN-2024-001)..."
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

            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              💡 <strong>Search Options:</strong> Customer Code ("CUS00001") • Customer Name ("Amit Sharma") • Loan Code ("LN-2024-001")
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 20 }}>
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div>
              <div className="alert alert-success" style={{ marginBottom: 12 }}>
                <CheckCircle2 size={16} />
                {success}
              </div>
              
              {/* PDF Download Buttons */}
              {receiptData && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={async () => {
                      try {
                        await downloadReceiptAsPDF(receiptData);
                      } catch (err) {
                        alert('Failed to download PDF. Please try again.');
                      }
                    }}
                  >
                    <Download size={14} /> Download Receipt PDF
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      try {
                        printReceipt(receiptData);
                      } catch (err) {
                        alert('Failed to open print dialog.');
                      }
                    }}
                  >
                    <Printer size={14} /> Print Receipt
                  </button>
                </div>
              )}
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
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {loan.customerName}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          Loan: {loan.loanCode || 'N/A'} • Customer: {loan.customerCode || 'N/A'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>
                          ₹{(loan.totalReceivable / 100).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {loan.pendingInstallments} pending
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
              {/* Loan Information */}
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
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Loan Code</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#6366f1' }}>{selectedLoan.loanCode || 'N/A'}</div>
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

                {/* Payment Summary - NEW ENHANCED SECTION */}
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
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total Paid Amount</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>
                        ₹{(selectedLoan.totalPaidAmount / 100).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total Remaining Due</div>
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

                {/* Installment Summary - Enhanced Display */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Hash size={14} color="#6366f1" />
                    Installment Details
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
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

                  {/* Last Paid Installment Details */}
                  {selectedLoan.lastPaidDate && (
                    <div style={{ 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      padding: 16, 
                      borderRadius: 8,
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      marginBottom: 16
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <CheckCircle size={16} color="#10b981" />
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>Last Paid Installment</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Installment Number</div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>#{selectedLoan.paidInstallments}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Paid Date</div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>
                            {new Date(selectedLoan.lastPaidDate).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Paid Amount</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>
                            ₹{((selectedLoan.totalLoanAmount / selectedLoan.totalInstallments) / 100).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Payment History */}
                  {!selectedLoan.lastPaidDate && (
                    <div style={{ 
                      background: 'rgba(156, 163, 175, 0.1)', 
                      padding: 16, 
                      borderRadius: 8,
                      border: '1px solid rgba(156, 163, 175, 0.2)',
                      marginBottom: 16,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        No payments made yet
                      </div>
                    </div>
                  )}
                </div>

                {/* Next Due Date */}
                {selectedLoan.nextDueDate && (
                  <div style={{ 
                    background: 'rgba(245, 158, 11, 0.1)', 
                    padding: 12, 
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <Clock size={14} color="#f59e0b" />
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Next Due Date</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {new Date(selectedLoan.nextDueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Collection Form */}
              <div className="card">
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={16} color="#6366f1" />
                  Collection Entry Form
                </div>

                <form onSubmit={handleSubmitCollection}>
                  {/* Customer Name - Readonly */}
                  <div style={{ marginBottom: 16 }}>
                    <div className="input-label">
                      <User size={12} /> Customer Name
                    </div>
                    <input
                      type="text"
                      className="input"
                      value={selectedLoan.customerName}
                      readOnly
                      style={{ 
                        background: 'var(--bg-elevated)', 
                        color: 'var(--text-muted)',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>

                  {/* Loan Code - Readonly */}
                  <div style={{ marginBottom: 16 }}>
                    <div className="input-label">
                      <Hash size={12} /> Loan Code
                    </div>
                    <input
                      type="text"
                      className="input"
                      value={selectedLoan.loanCode || selectedLoan.loanId}
                      readOnly
                      style={{ 
                        background: 'var(--bg-elevated)', 
                        color: 'var(--text-muted)',
                        cursor: 'not-allowed',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    />
                  </div>

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
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                      ✅ Today and previous dates allowed • ❌ Future dates restricted
                    </div>
                  </div>

                  {/* Direct Entry Switch (Admin Only) */}
                  {isAdmin && (
                    <div style={{ 
                      marginBottom: 16, 
                      padding: 12, 
                      background: 'rgba(99, 102, 241, 0.05)', 
                      borderRadius: 8, 
                      border: '1px solid rgba(99, 102, 241, 0.15)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between' 
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Direct Collection Entry</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Skip approval workflow and update immediately</div>
                      </div>
                      <label className="switch" style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                        <input 
                          type="checkbox" 
                          checked={formData.directEntry}
                          onChange={(e) => setFormData(prev => ({ ...prev, directEntry: e.target.checked }))}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: formData.directEntry ? '#6366f1' : '#ccc',
                          transition: '0.4s',
                          borderRadius: 24,
                          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '""',
                            height: 18, width: 18,
                            left: formData.directEntry ? 22 : 4,
                            bottom: 3,
                            backgroundColor: 'white',
                            transition: '0.4s',
                            borderRadius: '50%',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                          }} />
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Payment Mode */}
                  <div style={{ marginBottom: 16 }}>
                    <div className="input-label">
                      <CreditCard size={12} /> Payment Mode *
                    </div>
                    <select
                      className="input"
                      value={formData.paymentMode}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMode: e.target.value }))}
                      required
                      style={{ 
                        height: 44, 
                        fontSize: 14, 
                        width: '100%', 
                        background: 'var(--bg-elevated)', 
                        color: 'var(--text-primary)',
                        borderColor: 'var(--bg-border)'
                      }}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Upi">UPI / QR Code</option>
                      <option value="Bank_Transfer">Bank Transfer (IMPS/NEFT)</option>
                    </select>
                  </div>

                  {/* UTR / Reference Number */}
                  {formData.paymentMode !== 'Cash' && (
                    <div style={{ marginBottom: 16 }}>
                      <div className="input-label">
                        <Hash size={12} /> UTR / Transaction Reference *
                      </div>
                      <input
                        type="text"
                        className="input"
                        placeholder="Enter UTR or Txn Ref No..."
                        value={formData.utrRef}
                        onChange={(e) => setFormData(prev => ({ ...prev, utrRef: e.target.value }))}
                        required
                        style={{ height: 44, fontSize: 14 }}
                      />
                    </div>
                  )}

                  {/* Collection Amount */}
                  <div style={{ marginBottom: 16 }}>
                    <div className="input-label">
                      <DollarSign size={12} /> Collection Amount (₹) *
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
                    
                    {/* Quick Amount Buttons */}
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
                          This Month: ₹{(selectedLoan.currentMonthDue / 100).toLocaleString()}
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
                          Overdue: ₹{(selectedLoan.overdueAmount / 100).toLocaleString()}
                        </button>
                      )}
                      {selectedLoan.nextDueAmount > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ 
                            fontSize: 10, 
                            padding: '4px 8px', 
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: '#6366f1',
                            border: '1px solid rgba(99, 102, 241, 0.3)'
                          }}
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            collectionAmount: (selectedLoan.nextDueAmount / 100).toString() 
                          }))}
                        >
                          Next Due: ₹{(selectedLoan.nextDueAmount / 100).toLocaleString()}
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
                          Full Payment: ₹{(selectedLoan.totalRemainingAmount / 100).toLocaleString()}
                        </button>
                      )}
                    </div>

                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                      💡 Click a button above to quickly fill the amount
                    </div>
                  </div>

                  {/* Remarks */}
                  <div style={{ marginBottom: 20 }}>
                    <div className="input-label">Remarks (Optional)</div>
                    <textarea
                      className="input"
                      rows={3}
                      placeholder="Add any remarks about this collection..."
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
                        Recording Collection...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Submit Record Collection
                      </>
                    )}
                  </button>
                </form>

                {/* Validation Rules */}
                <div style={{ 
                  marginTop: 16, 
                  padding: 12, 
                  background: 'rgba(99,102,241,0.08)', 
                  borderRadius: 6,
                  fontSize: 11,
                  color: 'var(--text-muted)'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Validation Rules:</div>
                  <ul style={{ marginLeft: 16, marginTop: 4, lineHeight: 1.4 }}>
                    <li>Amount must be greater than 0</li>
                    <li>Only today and past dates allowed</li>
                    <li>All required fields must be filled</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {!selectedLoan && searchResults.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <TrendingUp size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Advanced Collection Entry Sheet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
                Search for customers by name or loan ID to record collection payments
              </p>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <strong>Search Options:</strong><br />
                • Customer Name: "Amit Sharma"<br />
                • Loan ID: "LN-2024-001"
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}