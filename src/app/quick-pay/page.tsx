'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CreditCard, Search, CheckCircle2, Loader2, AlertCircle,
  User, IndianRupee, Printer, Download, ArrowLeft, Clock, 
  Wallet, AlertTriangle, Zap, FileText, ChevronRight, TrendingDown
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { useAuth } from '@/context/AuthContext';
import { partnerService, Partner, PartnerCapitalSummary } from '@/services/partnerService';
import { companySettingsService, CompanySettings, BranchSettings } from '@/services/companySettingsService';
import { branchService, Branch } from '@/services/branchService';
import { formatNumber } from '@/lib/utils';
import ProfessionalReceipt, { ReceiptData } from '@/components/ProfessionalReceipt';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────
interface LoanDetails {
  loanId: string;
  loanCode: string;
  customerCode: string;
  customerName: string;
  customerPhone: string;
  loanAmount: number;
  totalPaid: number;
  outstanding: number;
  dueAmount: number;
  overdueAmount: number;
  fineAmount: number;
  loanStatus: string;
  nextInstallmentId: string;
  nextInstallmentNo: number;
  nextDueDate: string;
  productName: string;
}

interface QuickPayReceipt {
  receiptCode: string;
  receiptId: string;
  customerCode: string;
  customerName: string;
  customerPhone: string;
  loanCode: string;
  loanAmount: number;
  totalPaid: number;
  paidBefore: number;
  todayPayment: number;
  outstanding: number;
  paymentMode: string;
  paymentDate: string;
  remarks: string;
  installmentNo: number;
}

interface CapitalReceipt {
  receiptCode: string;
  partnerCode: string;
  partnerName: string;
  transactionType: string;
  amount: number;
  paymentMode: string;
  remarks: string;
  paymentDate: string;
  newBalance: number;
  status: string;
}

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash', emoji: '💵', color: '#10b981' },
  { value: 'upi', label: 'UPI', emoji: '📱', color: '#6366f1' },
  { value: 'bank_transfer', label: 'Bank Transfer', emoji: '🏦', color: '#f59e0b' },
];

const fmt = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// ─────────────────────────────────────────
// Steps: 1=search/select, 2=details, 3=pay/confirm, 4=receipt/success
// ─────────────────────────────────────────
export default function QuickPayPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'branch_manager';

  const [payType, setPayType] = useState<'loan' | 'capital'>('loan');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [loanDetails, setLoanDetails] = useState<LoanDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Capital flow states
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [capitalAction, setCapitalAction] = useState<'investment' | 'withdrawal'>('investment');
  const [capitalSummary, setCapitalSummary] = useState<PartnerCapitalSummary | null>(null);
  const [capitalReceipt, setCapitalReceipt] = useState<CapitalReceipt | null>(null);

  // Payment form
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [utrRef, setUtrRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  // Receipt
  const [receipt, setReceipt] = useState<QuickPayReceipt | null>(null);
  const [showProfessionalReceipt, setShowProfessionalReceipt] = useState(false);
  const [professionalReceiptData, setProfessionalReceiptData] = useState<ReceiptData | null>(null);

  // Collection officer
  const [submitting, setSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Dynamic data from database
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [branchSettings, setBranchSettings] = useState<BranchSettings | null>(null);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const searchRef = useRef<HTMLInputElement>(null);

  // Load company and branch settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoadingSettings(true);
        const [company, branch, branches] = await Promise.all([
          companySettingsService.getCompanySettings(),
          companySettingsService.getBranchSettings(),
          branchService.getAll()
        ]);
        
        setCompanySettings(company);
        setBranchSettings(branch);
        
        // Get current branch from user's branch or first active branch
        if (branches && branches.length > 0) {
          const userBranch = branches.find(b => b.id === user?.branchId);
          setCurrentBranch(userBranch || branches.find(b => b.isActive) || branches[0]);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, [user?.branchId]);

  // Fetch partners on load if we are in capital mode
  useEffect(() => {
    if (payType === 'capital') {
      partnerService.getAll().then(setPartners).catch(err => console.error(err));
    }
  }, [payType]);

  // Step 1: Search Loan
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setError('Enter at least 2 characters to search');
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const res = await apiClient.get<any>(`/api/v1/receipts/search-loan?q=${encodeURIComponent(searchQuery)}`);
      if (res.success && res.data) {
        setLoanDetails(res.data);
        setAmount((res.data.dueAmount / 100).toString()); // Pre-fill due amount
        setStep(2);
      } else {
        setError('No loan found. Try a different code or name.');
      }
    } catch (e: any) {
      setError(e.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  // Step 1: Select Partner Capital Account
  const handlePartnerSelect = async (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    if (!partnerId) {
      setCapitalSummary(null);
      return;
    }
    try {
      const summary = await partnerService.getCapitalSummary(partnerId);
      setCapitalSummary(summary);
      setAmount('');
    } catch (e: any) {
      console.error(e);
      setError('Failed to fetch capital summary for this partner.');
    }
  };

  // Step 3 → 4: Process Loan payment (admin immediate)
  const handleAdminPay = async () => {
    if (!loanDetails) return;
    const amountPaise = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountPaise) || amountPaise <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const res = await apiClient.post<any>('/api/v1/receipts/quick-pay', {
        loanCode: loanDetails.loanCode,
        amount: amountPaise,
        paymentMode,
        utrRef,
        remarks,
      });
      if (res.success && res.receipt) {
        setReceipt(res.receipt);
        
        // Create professional receipt data with database-fetched values
        const professionalData: ReceiptData = {
          receiptNumber: res.receipt.receiptCode || `RCP${Date.now().toString().slice(-6)}`,
          receiptDate: new Date().toISOString(),
          customerName: loanDetails.customerName,
          customerCode: loanDetails.customerCode,
          loanCode: loanDetails.loanCode,
          loanAmount: loanDetails.loanAmount,
          paidBefore: res.receipt.paidBefore || (loanDetails.totalPaid - amountPaise),
          todaysPayment: amountPaise,
          totalPaid: res.receipt.totalPaid || loanDetails.totalPaid,
          outstanding: res.receipt.outstanding || (loanDetails.outstanding - amountPaise),
          paymentMode: paymentMode.toUpperCase(),
          utrRef: utrRef || undefined,
          remarks: remarks || `Payment for loan ${loanDetails.loanCode}`,
          // Company details from database
          companyName: companySettings?.fullName || companySettings?.name || 'VETRI FINANCE PVT LTD',
          companyAddress: companySettings 
            ? `${companySettings.address}, ${companySettings.city} - ${companySettings.pinCode}, ${companySettings.state}, ${companySettings.country}`
            : 'Loading...',
          companyPhone: companySettings?.phone || '',
          companyEmail: companySettings?.email || '',
          companyGST: companySettings?.gstNumber || '',
          companyWebsite: companySettings?.website || '',
          companyLicense: companySettings?.licenseNumber || '',
          // Branch details from database
          branchName: currentBranch?.name || branchSettings?.name || '',
          branchCode: currentBranch?.code || branchSettings?.code || '',
          branchAddress: currentBranch?.address || branchSettings?.address || '',
          // User details from auth context
          cashierName: user?.name || user?.email || 'System User',
          terminalId: `POS-${currentBranch?.code || 'MAIN'}-001`
        };
        
        setProfessionalReceiptData(professionalData);
        setShowProfessionalReceipt(true);
        setStep(4);
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (e: any) {
      setError(e.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  // Collection Officer: submit loan request
  const handleOfficerSubmit = async () => {
    if (!loanDetails) return;
    const amountPaise = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountPaise) || amountPaise <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post<any>('/api/v1/collectionrequests', {
        installmentId: loanDetails.nextInstallmentId,
        amountPaid: amountPaise,
        mode: paymentMode,
        utrRef,
        remarks,
      });
      setRequestSubmitted(true);
      setStep(4);
    } catch (e: any) {
      setError(e.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3 → 4: Process Capital Transaction (Investment/Withdrawal)
  const handleCapitalSubmit = async () => {
    if (!selectedPartnerId || !amount) return;
    const amountPaise = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountPaise) || amountPaise <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const selectedPartner = partners.find(p => p.id === selectedPartnerId);
      if (!selectedPartner) throw new Error('Selected partner not found');

      if (capitalAction === 'investment') {
        const res = await partnerService.addInvestment({
          partnerId: selectedPartnerId,
          amount: amountPaise,
          paymentMode,
          remarks,
        });
        
        const tx = (res as any).transaction;
        setCapitalReceipt({
          receiptCode: tx?.transactionCode || 'TX-' + Math.floor(100000 + Math.random() * 900000),
          partnerCode: selectedPartner.code || 'N/A',
          partnerName: selectedPartner.name,
          transactionType: 'Contribution',
          amount: amountPaise,
          paymentMode,
          remarks: remarks || tx?.description || '',
          paymentDate: new Date().toLocaleString(),
          newBalance: (capitalSummary?.currentBalance || 0) + amountPaise,
          status: 'Approved'
        });
        setRequestSubmitted(false);
      } else {
        // Withdrawal flow
        const res = await partnerService.recordWithdrawal({
          partnerId: selectedPartnerId,
          amount: amountPaise,
          paymentMode,
          remarks,
        });
        
        const tx = (res as any).transaction;
        if (tx?.status?.toLowerCase() === 'approved') {
          setCapitalReceipt({
            receiptCode: tx?.transactionCode || 'TX-' + Math.floor(100000 + Math.random() * 900000),
            partnerCode: selectedPartner.code || 'N/A',
            partnerName: selectedPartner.name,
            transactionType: 'Withdrawal',
            amount: amountPaise,
            paymentMode,
            remarks: remarks || tx?.description || '',
            paymentDate: new Date().toLocaleString(),
            newBalance: (capitalSummary?.currentBalance || 0) - amountPaise,
            status: 'Approved'
          });
          setRequestSubmitted(false);
        } else {
          setRequestSubmitted(true);
        }
      }
      setStep(4);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Failed to process capital transaction');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    const w = window.open('', '', 'height=700,width=600');
    if (!w) return;
    if (payType === 'loan' && receipt) {
      w.document.write(buildReceiptHTML(receipt));
    } else if (payType === 'capital' && capitalReceipt) {
      w.document.write(buildCapitalReceiptHTML(capitalReceipt));
    }
    w.document.close();
    w.print();
  };

  const handleDownload = () => {
    let content = '';
    let name = '';
    if (payType === 'loan' && receipt) {
      content = buildReceiptHTML(receipt);
      name = `receipt_${receipt.receiptCode}.html`;
    } else if (payType === 'capital' && capitalReceipt) {
      content = buildCapitalReceiptHTML(capitalReceipt);
      name = `capital_receipt_${capitalReceipt.receiptCode}.html`;
    } else {
      return;
    }
    const blob = new Blob([content], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  };

  const reset = () => {
    setStep(1); setSearchQuery(''); setLoanDetails(null);
    setAmount(''); setPaymentMode('cash'); setUtrRef(''); setRemarks('');
    setSelectedPartnerId(''); setCapitalSummary(null); setCapitalReceipt(null);
    setReceipt(null); setError(null); setRequestSubmitted(false);
    setShowProfessionalReceipt(false); setProfessionalReceiptData(null);
    setTimeout(() => searchRef.current?.focus(), 100);
  };

  return (
    <div className="fade-in-up">
      {/* Loading Settings Overlay */}
      {loadingSettings && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 9999 
        }}>
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#6366f1' }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>Loading Settings...</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Fetching company and branch information
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Zap size={20} color="#6366f1" /> Quick Pay
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Fast processing for loan repayments and partner capital transactions.
          </p>
        </div>
        {step > 1 && (
          <button className="btn btn-secondary btn-sm" onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={13} /> New Payment
          </button>
        )}
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, alignItems: 'center' }}>
        {['Selection', 'Overview', 'Payment Details', 'Receipt'].map((label, i) => {
          const s = i + 1;
          const active = step === s;
          const done = step > s;
          return (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? '#10b981' : active ? '#6366f1' : 'var(--bg-elevated)',
                  color: done || active ? 'white' : 'var(--text-muted)',
                  fontSize: 12, fontWeight: 700, flexShrink: 0
                }}>
                  {done ? <CheckCircle2 size={14} /> : s}
                </div>
                <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {label}
                </span>
              </div>
              {i < 3 && <div style={{ flex: 1, height: 1, background: done ? '#10b981' : 'var(--bg-border)', margin: '0 8px', minWidth: 20 }} />}
            </React.Fragment>
          );
        })}
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 16, borderRadius: 12 }}>
          <AlertCircle size={15} /><span>{error}</span>
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
        </div>
      )}

      {/* ──── STEP 1: Selection ──── */}
      {step === 1 && (
        <div className="card" style={{ maxWidth: 520, margin: '0 auto', padding: 32 }}>
          {/* Module Selector (Defaults to Loan) */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 24, borderBottom: '1px solid var(--bg-border)', paddingBottom: 16 }}>
            <button 
              className={`btn ${payType === 'loan' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setPayType('loan'); setError(null); }}
              style={{ fontSize: 13, flex: 1 }}
            >
              💵 Loan Repayment
            </button>
            <button 
              className={`btn ${payType === 'capital' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setPayType('capital'); setError(null); }}
              style={{ fontSize: 13, flex: 1 }}
            >
              💼 Partner Capital
            </button>
          </div>

          {payType === 'loan' ? (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <Search size={24} color="#6366f1" />
                </div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>Search Customer / Loan</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Enter loan code, customer code, or customer name</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    ref={searchRef}
                    className="form-control"
                    style={{ paddingLeft: 36, fontSize: 15 }}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="e.g. LN00001 or CUST0001 or Rajan..."
                    autoFocus
                  />
                </div>
                <button className="btn btn-primary" onClick={handleSearch} disabled={searching} style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                  {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <User size={24} color="#6366f1" />
                </div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>Partner Capital Management</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Directly select partner & transaction type</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="input-label">Select Partner</label>
                <select 
                  className="select" 
                  style={{ width: '100%' }} 
                  value={selectedPartnerId}
                  onChange={e => handlePartnerSelect(e.target.value)}
                >
                  <option value="">-- Choose Partner --</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code || 'No Code'})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="input-label">Transaction Type</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className={`btn ${capitalAction === 'investment' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, fontSize: 12, padding: '8px' }}
                    onClick={() => setCapitalAction('investment')}
                  >
                    📈 Investment (Contribution)
                  </button>
                  <button
                    className={`btn ${capitalAction === 'withdrawal' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, fontSize: 12, padding: '8px' }}
                    onClick={() => setCapitalAction('withdrawal')}
                  >
                    📉 Withdrawal (Drawdown)
                  </button>
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                disabled={!selectedPartnerId}
                onClick={() => setStep(2)}
              >
                Proceed to Details <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ──── STEP 2: Overview/Details ──── */}
      {step === 2 && (
        <div>
          {payType === 'loan' && loanDetails ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="card">
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={12} /> Customer
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{loanDetails.customerName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 16 }}>
                    <span>Code: <strong>{loanDetails.customerCode}</strong></span>
                    {loanDetails.customerPhone && <span>📞 {loanDetails.customerPhone}</span>}
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={12} /> Loan
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#6366f1', marginBottom: 4 }}>{loanDetails.loanCode}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 16 }}>
                    <span>Amount: <strong>{fmt(loanDetails.loanAmount)}</strong></span>
                    <span>Status: <span className={`badge ${loanDetails.loanStatus === 'active' ? 'badge-success' : 'badge-gray'}`}>{loanDetails.loanStatus}</span></span>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Total Paid', value: fmt(loanDetails.totalPaid), color: '#10b981', icon: <CheckCircle2 size={14} /> },
                  { label: 'Outstanding', value: fmt(loanDetails.outstanding), color: '#6366f1', icon: <Wallet size={14} /> },
                  { label: 'Due Amount', value: fmt(loanDetails.dueAmount), color: '#f59e0b', icon: <Clock size={14} /> },
                  { label: 'Overdue', value: fmt(loanDetails.overdueAmount), color: loanDetails.overdueAmount > 0 ? '#ef4444' : '#10b981', icon: <AlertTriangle size={14} /> },
                ].map(item => (
                  <div key={item.label} className="card" style={{ padding: 14 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: item.color }}>{item.icon}</span> {item.label}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {loanDetails.nextDueDate && (
                <div style={{ padding: '10px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={14} color="#f59e0b" />
                  <span>Next installment #{loanDetails.nextInstallmentNo} due on <strong>{loanDetails.nextDueDate}</strong> — {fmt(loanDetails.dueAmount)}</span>
                </div>
              )}
            </div>
          ) : payType === 'capital' && capitalSummary ? (
            <div>
              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={12} /> Partner Capital Account
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{capitalSummary.partnerName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 16 }}>
                  <span>Partner Code: <strong>{capitalSummary.partnerCode || 'N/A'}</strong></span>
                  <span>Currency: <strong>INR</strong></span>
                </div>
              </div>

              {/* Financial Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Total Invested', value: fmt(capitalSummary.totalInvestment), color: '#10b981', icon: <CheckCircle2 size={14} /> },
                  { label: 'Current Capital Balance', value: fmt(capitalSummary.currentBalance), color: '#6366f1', icon: <Wallet size={14} /> },
                  { label: 'Total Profit Earned', value: fmt(capitalSummary.totalProfit), color: '#fbbf24', icon: <TrendingDown size={14} /> },
                  { label: 'Total Withdrawn', value: fmt(capitalSummary.totalWithdrawal), color: '#ec4899', icon: <AlertTriangle size={14} /> },
                ].map(item => (
                  <div key={item.label} className="card" style={{ padding: 14 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: item.color }}>{item.icon}</span> {item.label}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '10px 16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={14} color="#6366f1" />
                <span>Selected Action: <strong style={{ textTransform: 'uppercase' }}>{capitalAction}</strong></span>
              </div>
            </div>
          ) : null}

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>Proceed to Payment Details →</button>
          </div>
        </div>
      )}

      {/* ──── STEP 3: Payment/Transaction Form ──── */}
      {step === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Left Form */}
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IndianRupee size={15} color="#6366f1" />
              {payType === 'loan' ? (isAdmin ? 'Direct Payment Entry' : 'Collection Request') : `${capitalAction === 'investment' ? 'Capital Infusion' : 'Partner Drawdown'} Entry`}
            </div>

            {/* Amount */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                Amount (₹) *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 700, color: 'var(--text-muted)' }}>₹</span>
                <input
                  className="form-control"
                  style={{ paddingLeft: 28, fontSize: 22, fontWeight: 800 }}
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              {payType === 'loan' && loanDetails && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {[loanDetails.dueAmount / 100, loanDetails.outstanding / 100].filter(v => v > 0).map(v => (
                    <button key={v} className="btn btn-secondary btn-sm" onClick={() => setAmount(v.toString())}>
                      ₹{v.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Mode */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>
                Payment Mode
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {PAYMENT_MODES.map(mode => (
                  <button
                    key={mode.value}
                    onClick={() => setPaymentMode(mode.value)}
                    style={{
                      padding: '10px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                      border: `2px solid ${paymentMode === mode.value ? mode.color : 'var(--bg-border)'}`,
                      background: paymentMode === mode.value ? `${mode.color}10` : 'var(--bg-elevated)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifySelf: 'stretch', gap: 4,
                      fontWeight: paymentMode === mode.value ? 700 : 500,
                      fontSize: 12, color: paymentMode === mode.value ? mode.color : 'var(--text-secondary)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{mode.emoji}</span> {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Remarks */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                Remarks (optional)
              </label>
              <input className="form-control" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any notes..." />
            </div>

            {payType === 'loan' ? (
              isAdmin ? (
                <button
                  className="btn btn-primary"
                  onClick={handleAdminPay}
                  disabled={processing || !amount}
                  style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {processing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                  {processing ? 'Processing...' : `Pay ${amount ? `₹${parseFloat(amount).toLocaleString('en-IN')}` : 'Now'}`}
                </button>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={handleOfficerSubmit}
                  disabled={submitting || !amount}
                  style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '2px solid #f59e0b', color: '#f59e0b' }}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                  {submitting ? 'Submit for Approval' : 'Submit for Approval'}
                </button>
              )
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleCapitalSubmit}
                disabled={processing || !amount}
                style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {processing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                {processing ? 'Processing...' : (capitalAction === 'investment' ? 'Confirm & Process Investment' : (isAdmin ? 'Confirm & Process Withdrawal' : 'Submit Withdrawal Request'))}
              </button>
            )}
          </div>

          {/* Right Summary Panel */}
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--text-muted)' }}>Transaction Summary</div>
              {payType === 'loan' && loanDetails ? (
                <>
                  {[
                    { label: 'Customer', value: loanDetails.customerName },
                    { label: 'Loan Code', value: loanDetails.loanCode },
                    { label: 'Outstanding', value: fmt(loanDetails.outstanding) },
                    { label: 'Due Amount', value: fmt(loanDetails.dueAmount) },
                    { label: 'Payment Mode', value: PAYMENT_MODES.find(m => m.value === paymentMode)?.label || paymentMode },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bg-border)', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                      <span style={{ fontWeight: 600 }}>{row.value}</span>
                    </div>
                  ))}
                </>
              ) : payType === 'capital' && capitalSummary ? (
                <>
                  {[
                    { label: 'Partner', value: capitalSummary.partnerName },
                    { label: 'Partner Code', value: capitalSummary.partnerCode || 'N/A' },
                    { label: 'Current Balance', value: fmt(capitalSummary.currentBalance) },
                    { label: 'Transaction Type', value: capitalAction === 'investment' ? 'Investment' : 'Withdrawal' },
                    { label: 'Payment Mode', value: PAYMENT_MODES.find(m => m.value === paymentMode)?.label || paymentMode },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bg-border)', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                      <span style={{ fontWeight: 600 }}>{row.value}</span>
                    </div>
                  ))}
                </>
              ) : null}

              {amount && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 16, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                  <span>Transaction Amount</span>
                  <span>₹{parseFloat(amount || '0').toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            {isAdmin && (
              <div style={{ padding: 14, background: 'rgba(99,102,241,0.06)', borderRadius: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                <div style={{ fontWeight: 700, color: '#6366f1', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={12} /> Immediate Processing
                </div>
                Upon clicking Confirm, the system will:
                <ul style={{ marginTop: 6, marginLeft: 14, lineHeight: 1.8 }}>
                  <li>✓ Update balance immediately</li>
                  <li>✓ Post double-entry journal entries</li>
                  <li>✓ Update general ledger & cash balance</li>
                  <li>✓ Generate printable receipt</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──── STEP 4: Success / Receipt ──── */}
      {step === 4 && (
        <div>
          {requestSubmitted ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, maxWidth: 560, margin: '0 auto' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Clock size={28} color="#f59e0b" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Request Submitted!</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
                Your transaction request has been successfully submitted for admin approval.
                You'll see it reflected under Approvals once processed.
              </div>
              <button className="btn btn-primary" onClick={reset} style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Zap size={14} /> New Payment / Action
              </button>
            </div>
          ) : showProfessionalReceipt && professionalReceiptData ? (
            <ProfessionalReceipt 
              data={professionalReceiptData}
              onClose={() => {
                setShowProfessionalReceipt(false);
                setProfessionalReceiptData(null);
                reset();
              }}
            />
          ) : payType === 'capital' && capitalReceipt ? (
            <div style={{ maxWidth: 560, margin: '0 auto' }}>
              <div className="card" id="receipt-content" style={{ padding: 28 }}>
                <div style={{ textAlign: 'center', marginBottom: 24, padding: '16px', background: 'rgba(16,185,129,0.08)', borderRadius: 10 }}>
                  <CheckCircle2 size={32} color="#10b981" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>Transaction Successful!</div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '2px dashed var(--bg-border)' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>CAPITAL TRANSACTION RECEIPT</div>
                  <div style={{ fontSize: 14, color: '#6366f1', fontWeight: 700, marginTop: 4 }}>#{capitalReceipt.receiptCode}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Date: {capitalReceipt.paymentDate}</div>
                </div>

                <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Partner</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Code</div><div style={{ fontWeight: 700 }}>{capitalReceipt.partnerCode}</div></div>
                    <div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Name</div><div style={{ fontWeight: 700 }}>{capitalReceipt.partnerName}</div></div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Transaction</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Type</div><div style={{ fontWeight: 700 }}>{capitalReceipt.transactionType === 'Contribution' ? 'Investment' : 'Withdrawal'}</div></div>
                    <div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Status</div><div style={{ fontWeight: 700, color: '#10b981' }}>{capitalReceipt.status}</div></div>
                    <div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Payment Mode</div><div style={{ fontWeight: 700, textTransform: 'uppercase' }}>{capitalReceipt.paymentMode}</div></div>
                    <div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Remarks</div><div style={{ fontWeight: 700 }}>{capitalReceipt.remarks || 'N/A'}</div></div>
                  </div>

                  <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: 14, marginTop: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Transaction Amount</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{fmt(capitalReceipt.amount)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>New Balance</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: '#6366f1' }}>{fmt(capitalReceipt.newBalance)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', paddingTop: 12, borderTop: '1px dashed var(--bg-border)' }}>
                  Computer generated receipt — No signature required
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={reset} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Zap size={13} /> New Transaction
                </button>
                <button className="btn btn-secondary" onClick={handlePrint} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Printer size={13} /> Print
                </button>
                <button className="btn btn-primary" onClick={handleDownload} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Download size={13} /> Download
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function buildReceiptHTML(r: QuickPayReceipt): string {
  const fmt = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt ${r.receiptCode}</title>
<style>body{font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:20px;font-size:13px}
h1{text-align:center;font-size:20px;margin-bottom:4px}.rc{text-align:center;color:#6366f1;font-size:15px;font-weight:bold;margin-bottom:2px}
.date{text-align:center;color:#666;font-size:11px;margin-bottom:16px}hr{border:1px dashed #ccc}
.row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f5f5f5}
.lbl{color:#888}.val{font-weight:bold}.big{font-size:20px;font-weight:900;color:#10b981}
.footer{text-align:center;font-size:10px;color:#aaa;margin-top:14px}
</style></head><body>
<h1>PAYMENT RECEIPT</h1>
<div class="rc">#${r.receiptCode}</div>
<div class="date">${r.paymentDate}</div><hr>
<div class="row"><span class="lbl">Customer</span><span class="val">${r.customerName}</span></div>
<div class="row"><span class="lbl">Customer Code</span><span class="val">${r.customerCode}</span></div>
<div class="row"><span class="lbl">Loan Code</span><span class="val">${r.loanCode}</span></div>
<div class="row"><span class="lbl">Loan Amount</span><span class="val">${fmt(r.loanAmount)}</span></div>
<div class="row"><span class="lbl">Paid Before</span><span class="val">${fmt(r.paidBefore)}</span></div>
<hr>
<div class="row"><span class="lbl">Today's Payment</span><span class="val big">${fmt(r.todayPayment)}</span></div>
<div class="row"><span class="lbl">Total Paid</span><span class="val">${fmt(r.totalPaid)}</span></div>
<div class="row"><span class="lbl">Outstanding</span><span class="val">${fmt(r.outstanding)}</span></div>
<div class="row"><span class="lbl">Payment Mode</span><span class="val">${r.paymentMode.toUpperCase()}</span></div>
<hr>
<div class="footer">Computer generated receipt — No signature required</div>
</body></html>`;
}

function buildCapitalReceiptHTML(r: CapitalReceipt): string {
  const fmtVal = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt ${r.receiptCode}</title>
<style>body{font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:20px;font-size:13px}
h1{text-align:center;font-size:18px;margin-bottom:4px}.rc{text-align:center;color:#6366f1;font-size:14px;font-weight:bold;margin-bottom:2px}
.date{text-align:center;color:#666;font-size:11px;margin-bottom:16px}hr{border:1px dashed #ccc}
.row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f5f5f5}
.lbl{color:#888}.val{font-weight:bold}.big{font-size:18px;font-weight:900;color:#10b981}
.footer{text-align:center;font-size:10px;color:#aaa;margin-top:14px}
</style></head><body>
<h1>CAPITAL TRANSACTION RECEIPT</h1>
<div class="rc">#${r.receiptCode}</div>
<div class="date">${r.paymentDate}</div><hr>
<div class="row"><span class="lbl">Partner Name</span><span class="val">${r.partnerName}</span></div>
<div class="row"><span class="lbl">Partner Code</span><span class="val">${r.partnerCode}</span></div>
<div class="row"><span class="lbl">Transaction Type</span><span class="val">${r.transactionType === 'Contribution' ? 'Investment (Contribution)' : 'Withdrawal (Drawdown)'}</span></div>
<hr>
<div class="row"><span class="lbl">Transaction Amount</span><span class="val big">${fmtVal(r.amount)}</span></div>
<div class="row"><span class="lbl">Payment Mode</span><span class="val">${r.paymentMode.toUpperCase()}</span></div>
<div class="row"><span class="lbl">Remarks</span><span class="val">${r.remarks || 'N/A'}</span></div>
<div class="row"><span class="lbl">New Balance</span><span class="val" style="color: #6366f1">${fmtVal(r.newBalance)}</span></div>
<hr>
<div class="footer">Computer generated receipt — No signature required</div>
</body></html>`;
}
