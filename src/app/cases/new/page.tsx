'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  User, CreditCard, Calculator, Calendar, Shield, Users, CheckCircle2,
  ChevronRight, ChevronLeft, AlertTriangle, Info, FileText, Printer,
  Send, Lock, Plus, Trash2, Upload, Eye, Loader2, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { calculateLoan, LoanCaseInput, createRepaymentJournal } from '@/lib/loanEngine';
import { formatNumber } from '@/lib/utils';
import { customerService, Customer } from '@/services/customerService';
import { loanService } from '@/services/loanService';
import { apiClient } from '@/services/apiClient';

const STEPS = [
  { no: 1, label: 'Entity Mapping',     icon: User },
  { no: 2, label: 'Financials',         icon: Calculator },
  { no: 3, label: 'Schedule',           icon: Calendar },
  { no: 4, label: 'Penalty Logic',      icon: AlertTriangle },
  { no: 5, label: 'Guarantor & KYC',    icon: Shield },
  { no: 6, label: 'Review & Disburse',  icon: CheckCircle2 },
];

interface FormState extends LoanCaseInput {
  customerSearch: string;
  selectedCustomerId: string;
  selectedCustomerName: string;
  selectedCustomerCode: string;
  selectedCustomerPhone: string;
  
  // Guarantor
  guarantorName: string;
  guarantorPhone: string;
  guarantorAadhaar: string;
  guarantorPan: string;
  guarantorAddress: string;
  guarantorRelation: string;
  liabilityAgreementSigned: boolean;
  
  // Collateral
  collateralType: string;
  collateralDesc: string;
  collateralValue: string;
  documentUrls: string;
}

const defaultForm: FormState = {
  customerSearch: '',
  selectedCustomerId: '',
  selectedCustomerName: '',
  selectedCustomerCode: '',
  selectedCustomerPhone: '',
  financeAmount: 50000,
  interestAmount: 5000,
  fileCharges: 500,
  fileChargesType: 'fixed',
  chargesDeductedFrom: 'disbursement',
  numberOfInstallments: 100,
  initialInstallment: 600,
  restInstallment: 545,
  startDate: new Date().toISOString().split('T')[0],
  frequency: 'daily',
  fineAmount: 50,
  fineType: 'per_day',
  fineTriggerDays: 2,
  guarantorName: '',
  guarantorPhone: '',
  guarantorAadhaar: '',
  guarantorPan: '',
  guarantorAddress: '',
  guarantorRelation: 'Spouse',
  liabilityAgreementSigned: false,
  collateralType: 'property',
  collateralDesc: '',
  collateralValue: '',
  documentUrls: '',
};

export default function CaseCreationPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [calcResult, setCalcResult] = useState<ReturnType<typeof calculateLoan> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Flow result
  const [flowResult, setFlowResult] = useState<{
    success: boolean;
    loanId?: string;
    loanCode?: string;
    actionTaken: 'submitted_for_approval' | 'direct_disbursed';
  } | null>(null);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'branch_manager';

  const set = (key: keyof FormState, val: any) => setForm(f => ({ ...f, [key]: val }));

  const runCalculate = useCallback(() => {
    const result = calculateLoan({
      financeAmount: Number(form.financeAmount),
      interestAmount: Number(form.interestAmount),
      fileCharges: Number(form.fileCharges),
      fileChargesType: form.fileChargesType,
      chargesDeductedFrom: form.chargesDeductedFrom,
      numberOfInstallments: Number(form.numberOfInstallments),
      initialInstallment: Number(form.initialInstallment),
      restInstallment: Number(form.restInstallment),
      startDate: form.startDate,
      frequency: form.frequency,
      fineAmount: Number(form.fineAmount),
      fineType: form.fineType,
      fineTriggerDays: Number(form.fineTriggerDays),
    });
    setCalcResult(result);
  }, [form]);

  // Main submission handler
  const handleSubmission = async (directDisburse: boolean) => {
    if (!form.selectedCustomerId) {
      setError('Please select or create a customer first.');
      return;
    }

    // Always calculate fresh before submission to ensure we have valid data
    const currentCalcResult = calculateLoan({
      financeAmount: Number(form.financeAmount),
      interestAmount: Number(form.interestAmount),
      fileCharges: Number(form.fileCharges),
      fileChargesType: form.fileChargesType,
      chargesDeductedFrom: form.chargesDeductedFrom,
      numberOfInstallments: Number(form.numberOfInstallments),
      initialInstallment: Number(form.initialInstallment),
      restInstallment: Number(form.restInstallment),
      startDate: form.startDate,
      frequency: form.frequency,
      fineAmount: Number(form.fineAmount),
      fineType: form.fineType,
      fineTriggerDays: Number(form.fineTriggerDays),
    });

    // Store the calculation result for later use
    setCalcResult(currentCalcResult);

    setSubmitting(true);
    setError(null);

    try {
      // 1. Create the loan case in DRAFT status
      // Backend expects Principal (financeAmount), InterestAmount, and ProcessingFees in Paise
      const createReq = {
        customerId: form.selectedCustomerId,
        principal: Math.round(Number(form.financeAmount) * 100),
        interestAmount: Math.round(Number(form.interestAmount) * 100),
        processingFees: Math.round(currentCalcResult.fileChargesAmount * 100),
        documentUrls: form.documentUrls
      };

      console.log('Sending CreateLoanRequest:', createReq);
      const loan = await loanService.create(createReq);
      console.log('Created loan:', loan);

      if (!loan || !loan.id) {
        throw new Error('Failed to create loan case in database.');
      }

      // 2. Generate repayment installments in database
      console.log(`Generating ${form.numberOfInstallments} installments for loan: ${loan.id}`);
      await apiClient.post(`/api/v1/Installments/generate/${loan.id}?count=${form.numberOfInstallments}`, {});

      if (directDisburse && isAdmin) {
        // Direct disburse flow: Approve first, then Disburse
        console.log('Direct disburse: Approving...');
        await loanService.approveLoan(loan.id);

        console.log('Direct disburse: Disbursing...');
        await loanService.disburse(loan.id);

        setFlowResult({
          success: true,
          loanId: loan.id,
          loanCode: loan.loanCode || 'LN-NEW',
          actionTaken: 'direct_disbursed'
        });
      } else {
        // Submit for approval workflow (Default for Loan Officer)
        console.log('Submitting for approval...');
        await loanService.submitLoanForApproval(loan.id);

        setFlowResult({
          success: true,
          loanId: loan.id,
          loanCode: loan.loanCode || 'LN-NEW',
          actionTaken: 'submitted_for_approval'
        });
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Workflow action failed. Please verify API connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (flowResult) {
    return (
      <div className="fade-in-up" style={{ maxWidth: 700, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>
          {flowResult.actionTaken === 'direct_disbursed' ? '💸' : '⏳'}
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#34d399', marginBottom: 8 }}>
          {flowResult.actionTaken === 'direct_disbursed' 
            ? 'Loan Case Disbursed Successfully!' 
            : 'Loan Submitted for Approval!'}
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
          {flowResult.actionTaken === 'direct_disbursed'
            ? 'Installment schedule generated • Double-entry journals posted'
            : 'Routed to Branch Managers & Admins for verification'}
        </p>

        <div className="card" style={{ textAlign: 'left', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Loan Case Details</div>
          {[
            ['Loan Code', flowResult.loanCode],
            ['Customer', form.selectedCustomerName],
            ['Finance Amount', `₹${Number(form.financeAmount).toLocaleString()}`],
            ['Interest Amount', `₹${Number(form.interestAmount).toLocaleString()}`],
            ['Installments', `${form.numberOfInstallments} payments`],
            ['Action Taken', flowResult.actionTaken === 'direct_disbursed' ? 'Direct Disbursement' : 'Submitted for Approval'],
            ['Date', new Date().toLocaleDateString('en-IN')]
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid var(--bg-border)', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{val}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {flowResult.actionTaken === 'direct_disbursed' && (
            <button className="btn btn-secondary" onClick={() => window.print()}><Printer size={13} /> Print Agreement</button>
          )}
          <button className="btn btn-primary" onClick={() => { setFlowResult(null); setStep(1); setForm(defaultForm); setCalcResult(null); }}>
            <Plus size={13} /> Create Another Case
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in-up" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>New Loan Case — Repayment & Verification</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Onboard borrower, verify KYC, generate immutable payment plan & submit for branch authorization
        </p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, position: 'relative' }}>
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = step > s.no;
          const active = step === s.no;
          return (
            <React.Fragment key={s.no}>
              <div
                onClick={() => step > s.no && setStep(s.no)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: done ? 'pointer' : 'default', minWidth: 80 }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? 'var(--grad-success)' : active ? 'var(--grad-primary)' : 'var(--bg-elevated)',
                  border: `2px solid ${done ? '#10b981' : active ? '#6366f1' : 'var(--bg-border)'}`,
                  transition: 'all 0.2s',
                }}>
                  {done ? <CheckCircle2 size={16} color="white" /> : <Icon size={14} color={active ? 'white' : 'var(--text-muted)'} />}
                </div>
                <span style={{ fontSize: 10, color: active ? '#a5b4fc' : done ? '#34d399' : 'var(--text-muted)', fontWeight: active ? 700 : 500, textAlign: 'center', lineHeight: 1.2 }}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: step > s.no ? '#10b981' : 'var(--bg-border)', marginTop: 17, transition: 'background 0.3s' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 16, borderRadius: 10 }}>
          <AlertTriangle size={13} /><span>{error}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="card" style={{ marginBottom: 16, minHeight: 400 }}>
        {step === 1 && <Step1EntityMapping form={form} set={set} />}
        {step === 2 && <Step2Financials form={form} set={set} calcResult={calcResult} onCalculate={runCalculate} />}
        {step === 3 && <Step3Schedule calcResult={calcResult} form={form} />}
        {step === 4 && <Step4Penalty form={form} set={set} />}
        {step === 5 && <Step5GuarantorKYC form={form} set={set} />}
        {step === 6 && calcResult && (
          <Step6Review 
            form={form} 
            calcResult={calcResult} 
            isAdmin={isAdmin}
            submitting={submitting}
            onSubmit={handleSubmission} 
          />
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-secondary" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>
          <ChevronLeft size={14} /> Previous
        </button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Step {step} of {STEPS.length}</span>
          {step < STEPS.length && (
            <button className="btn btn-primary"
              onClick={() => { if (step === 2) runCalculate(); setStep(s => Math.min(STEPS.length, s + 1)); }}>
              Next <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Entity Mapping ───────────────────────────────────
function Step1EntityMapping({ form, set }: { form: FormState; set: (k: keyof FormState, v: any) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });

  // Handle customer search API
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await customerService.searchByCode(searchQuery);
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) return;
    setCreating(true);
    try {
      const res = await customerService.create(newCustomer);
      set('selectedCustomerId', res.id);
      set('selectedCustomerName', res.name);
      set('selectedCustomerCode', res.code || '');
      set('selectedCustomerPhone', res.phone);
      setNewCustomer({ name: '', phone: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to register borrower.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Step 1 — Borrower Search & Onboarding</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Customer Lookup */}
        <div>
          <div className="input-label">Search Existing Borrowers</div>
          <input 
            className="input" 
            placeholder="Type name, phone, or customer code..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} 
          />
          
          {searching && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Searching Database...</div>}
          
          {results.length > 0 && (
            <div style={{ border: '1px solid var(--bg-border)', borderRadius: 8, marginTop: 4, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
              {results.map(c => (
                <div key={c.id} onClick={() => { 
                  set('selectedCustomerId', c.id); 
                  set('selectedCustomerName', c.name); 
                  set('selectedCustomerCode', c.code || '');
                  set('selectedCustomerPhone', c.phone);
                  setSearchQuery(''); 
                  setResults([]);
                }}
                  className="nav-item" style={{ borderRadius: 0, fontSize: 12, padding: '10px 14px', cursor: 'pointer' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    Code: {c.code || 'N/A'} • Phone: {c.phone}
                  </div>
                </div>
              ))}
            </div>
          )}

          {form.selectedCustomerId && (
            <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(16,185,129,0.06)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>Selected Borrower</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{form.selectedCustomerName}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Code: {form.selectedCustomerCode || '—'} • Phone: {form.selectedCustomerPhone}
              </div>
            </div>
          )}
        </div>

        {/* Quick Create Borrower */}
        <div style={{ borderLeft: '1px solid var(--bg-border)', paddingLeft: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Register New Borrower</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input 
              className="input" 
              placeholder="Borrower Full Name" 
              value={newCustomer.name} 
              onChange={e => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
            />
            <input 
              className="input" 
              placeholder="10-Digit Mobile Number" 
              value={newCustomer.phone}
              onChange={e => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
            />
            <button 
              className="btn btn-secondary" 
              onClick={handleCreateCustomer} 
              disabled={creating || !newCustomer.name || !newCustomer.phone}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Onboard & Select Borrower
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Financials ───────────────────────────────────────
function Step2Financials({ form, set, calcResult, onCalculate }: any) {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Step 2 — Financials & Repayment Calculation</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {[
          { label: 'Loan Amount / Principal (₹)', key: 'financeAmount', placeholder: '50000' },
          { label: 'Interest Charged (₹)', key: 'interestAmount', placeholder: '5000' },
          { label: 'Number of Installments', key: 'numberOfInstallments', placeholder: '100' },
          { label: 'First Installment (₹)', key: 'initialInstallment', placeholder: '600' },
          { label: 'Subsequent Installments (₹)', key: 'restInstallment', placeholder: '545' },
          { label: 'Processing Fees (₹)', key: 'fileCharges', placeholder: '500' },
        ].map(f => (
          <div key={f.key}>
            <div className="input-label">{f.label}</div>
            <input className="input" type="number" placeholder={f.placeholder} value={(form as any)[f.key]}
              onChange={e => set(f.key, e.target.value)} />
          </div>
        ))}
        <div>
          <div className="input-label">File Charges Deduct</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {([['disbursement', 'Deduct from Payout'], ['loan', 'Add to Total Due']] as const).map(([val, label]) => (
              <button key={val} type="button" className={`btn btn-sm ${form.chargesDeductedFrom === val ? 'btn-primary' : 'btn-secondary'}`} onClick={() => set('chargesDeductedFrom', val)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="input-label">Disbursement Date</div>
          <input className="input" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
        </div>
      </div>

      <button className="btn btn-primary" style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6 }} onClick={onCalculate}>
        <Calculator size={14} /> Run Calculation Engine
      </button>

      {calcResult && (
        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          {[
            { label: 'Total Receivable', val: `₹${calcResult.totalReceivable.toLocaleString()}`, color: '#a5b4fc' },
            { label: 'Net Payout', val: `₹${calcResult.netDisbursement.toLocaleString()}`, color: '#34d399' },
            { label: 'Processing Fees', val: `₹${calcResult.fileChargesAmount.toLocaleString()}`, color: '#fbbf24' },
            { label: 'Checksum Verification', val: calcResult.isValid ? 'Verified ✓' : 'Mismatch ✗', color: calcResult.isValid ? '#34d399' : '#f87171' },
            { label: 'Maturity Date', val: calcResult.endDate, color: '#22d3ee' },
          ].map((item, i) => (
            <div key={i} style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: item.color }}>{item.val}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Schedule ─────────────────────────────────────────
function Step3Schedule({ calcResult, form }: any) {
  if (!calcResult) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
      <AlertTriangle size={32} color="#f59e0b" />
      <div style={{ color: 'var(--text-muted)' }}>Go back to Step 2 and run calculation engine first.</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Step 3 — Generated Repayment Plan</div>
        <div style={{ fontSize: 11, background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', padding: '4px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Lock size={12} /> Schedule will lock on approval
        </div>
      </div>
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        <table className="data-table" style={{ fontSize: 12 }}>
          <thead>
            <tr><th>No</th><th>Due Date</th><th>Installment Amount</th><th>Principal Component</th><th>Interest Component</th></tr>
          </thead>
          <tbody>
            {calcResult.schedule.slice(0, 15).map((r: any) => (
              <tr key={r.no}>
                <td>#{r.no}</td>
                <td className="mono">{r.dueDate}</td>
                <td style={{ fontWeight: 700, color: '#fbbf24' }}>₹{r.amount}</td>
                <td>₹{r.principal}</td>
                <td style={{ color: '#f87171' }}>₹{r.interest}</td>
              </tr>
            ))}
            {calcResult.schedule.length > 15 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 12 }}>
                  ... and {calcResult.schedule.length - 15} more installments
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Step 4: Penalty Logic ────────────────────────────────────
function Step4Penalty({ form, set }: any) {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Step 4 — Automated Penalty Terms</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div>
          <div className="input-label">Late Fine / Penalty (₹)</div>
          <input className="input" type="number" value={form.fineAmount} onChange={e => set('fineAmount', e.target.value)} />
        </div>
        <div>
          <div className="input-label">Grace Period before fine triggers (Days)</div>
          <input className="input" type="number" value={form.fineTriggerDays} onChange={e => set('fineTriggerDays', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

// ─── Step 5: Guarantor & KYC ─────────────────────────────────
function Step5GuarantorKYC({ form, set }: any) {
  const [guarantorAadhaarFile, setGuarantorAadhaarFile] = useState<string | null>(null);
  const [guarantorPanFile, setGuarantorPanFile] = useState<string | null>(null);
  
  const [uploadingAadhaar, setUploadingAadhaar] = useState(false);
  const [uploadingPan, setUploadingPan] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'aadhaar' | 'pan') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === 'aadhaar') setUploadingAadhaar(true);
    else setUploadingPan(true);

    try {
      const formData = new FormData();
      formData.append('files', file);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const response = await fetch(`${API_URL}/api/v1/LoanCases/upload-temp`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const res = await response.json();

      if (res.urls?.[0]) {
        const uploadedUrl = res.urls[0];
        const currentUrls = form.documentUrls ? form.documentUrls.split(',') : [];
        currentUrls.push(uploadedUrl);
        set('documentUrls', currentUrls.join(','));
        
        if (field === 'aadhaar') {
          setGuarantorAadhaarFile(file.name);
        } else {
          setGuarantorPanFile(file.name);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload document.');
    } finally {
      if (field === 'aadhaar') setUploadingAadhaar(false);
      else setUploadingPan(false);
    }
  };

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Step 5 — Guarantor Verification & KYC Attachments</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Guarantor Details */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Guarantor Information</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input className="input" placeholder="Guarantor Name" value={form.guarantorName} onChange={e => set('guarantorName', e.target.value)} />
            <input className="input" placeholder="Mobile Number" value={form.guarantorPhone} onChange={e => set('guarantorPhone', e.target.value)} />
            <input className="input" placeholder="Aadhaar Card Number" value={form.guarantorAadhaar} onChange={e => set('guarantorAadhaar', e.target.value)} />
            <input className="input" placeholder="PAN Card Number" value={form.guarantorPan} onChange={e => set('guarantorPan', e.target.value)} />
          </div>
        </div>

        {/* KYC Files Upload */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>KYC Document Attachments</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="file"
                id="aadhaar-upload-input"
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(e, 'aadhaar')}
              />
              <label
                htmlFor="aadhaar-upload-input"
                style={{ border: '2px dashed var(--bg-border)', borderRadius: 8, padding: 16, textAlign: 'center', cursor: 'pointer', display: 'block' }}
              >
                {uploadingAadhaar ? (
                  <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 8px', color: '#6366f1' }} />
                ) : (
                  <Upload size={20} style={{ margin: '0 auto 8px', color: 'var(--text-muted)' }} />
                )}
                <div style={{ fontSize: 12, color: guarantorAadhaarFile ? '#10b981' : 'var(--text-muted)' }}>
                  {uploadingAadhaar ? 'Uploading file...' : guarantorAadhaarFile ? `✓ ${guarantorAadhaarFile}` : 'Upload Borrower & Guarantor Aadhaar'}
                </div>
              </label>
            </div>
            
            <div style={{ position: 'relative' }}>
              <input
                type="file"
                id="pan-upload-input"
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(e, 'pan')}
              />
              <label
                htmlFor="pan-upload-input"
                style={{ border: '2px dashed var(--bg-border)', borderRadius: 8, padding: 16, textAlign: 'center', cursor: 'pointer', display: 'block' }}
              >
                {uploadingPan ? (
                  <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 8px', color: '#6366f1' }} />
                ) : (
                  <Upload size={20} style={{ margin: '0 auto 8px', color: 'var(--text-muted)' }} />
                )}
                <div style={{ fontSize: 12, color: guarantorPanFile ? '#10b981' : 'var(--text-muted)' }}>
                  {uploadingPan ? 'Uploading file...' : guarantorPanFile ? `✓ ${guarantorPanFile}` : 'Upload Borrower & Guarantor PAN Card'}
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 6: Review & Disburse/Submit ─────────────────────────
function Step6Review({ form, calcResult, isAdmin, submitting, onSubmit }: any) {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Step 6 — Final Review & Verification</div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Verification Summary */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Loan Parameters</div>
          {[
            ['Borrower', form.selectedCustomerName],
            ['Guarantor', form.guarantorName || 'N/A'],
            ['Principal (financeAmount)', `₹${Number(form.financeAmount).toLocaleString()}`],
            ['Total Payable', `₹${calcResult.totalReceivable.toLocaleString()}`],
            ['Processing Fee', `₹${calcResult.fileChargesAmount.toLocaleString()}`],
            ['Installments count', `${form.numberOfInstallments} payments`],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid var(--bg-border)', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Workflow actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
          {isAdmin ? (
            <>
              <div className="alert alert-info">
                <Info size={14} />
                <span>You have Admin permissions. You can disburse this loan case immediately.</span>
              </div>
              <button 
                className="btn btn-primary"
                disabled={submitting}
                onClick={() => onSubmit(true)}
                style={{ width: '100%', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Create & Direct Disburse
              </button>
              
              <button 
                className="btn btn-secondary"
                disabled={submitting}
                onClick={() => onSubmit(false)}
                style={{ width: '100%', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                Create & Submit for Approval (Draft)
              </button>
            </>
          ) : (
            <>
              <div className="alert alert-warning">
                <Info size={14} />
                <span>Your application will be routed to branch managers/admins for authorization.</span>
              </div>
              <button 
                className="btn btn-primary"
                disabled={submitting}
                onClick={() => onSubmit(false)}
                style={{ width: '100%', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Submit Case for Admin Approval
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
