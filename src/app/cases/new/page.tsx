'use client';
import React, { useState, useCallback } from 'react';
import {
  User, CreditCard, Calculator, Calendar, Shield, Users, CheckCircle2,
  ChevronRight, ChevronLeft, AlertTriangle, Info, FileText, Printer,
  Send, Lock, Plus, Trash2, Upload, Eye
} from 'lucide-react';
import { calculateLoan, LoanCaseInput, createDisbursementJournal, generateCaseId } from '@/lib/loanEngine';
import { mockCustomers, mockAgents, addLoanCase, LoanCase } from '@/lib/erpData';
import { formatNumber } from '@/lib/utils';

// ─── Step definitions ─────────────────────────────────────────
const STEPS = [
  { no: 1, label: 'Entity Mapping',     icon: User },
  { no: 2, label: 'Financials',         icon: Calculator },
  { no: 3, label: 'Schedule',           icon: Calendar },
  { no: 4, label: 'Penalty Logic',      icon: AlertTriangle },
  { no: 5, label: 'Collateral & KYC',   icon: Shield },
  { no: 6, label: 'Guarantor',          icon: Users },
  { no: 7, label: 'Review & Disburse',  icon: CheckCircle2 },
];

interface FormState extends LoanCaseInput {
  customerSearch: string;
  selectedCustomerId: string;
  selectedCustomerName: string;
  selectedAgentId: string;
  selectedAgentName: string;
  loanType: 'daily' | 'weekly' | 'fortnightly' | 'monthly';
  product: string;
  // KYC
  aadhaarFront: string;
  panFile: string;
  digitalSig: string;
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
}

const defaultForm: FormState = {
  customerSearch: '',
  selectedCustomerId: '',
  selectedCustomerName: '',
  selectedAgentId: '',
  selectedAgentName: '',
  loanType: 'daily',
  product: 'Daily 100-Day Loan',
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
  aadhaarFront: '',
  panFile: '',
  digitalSig: '',
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
};

export default function CaseCreationPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [calcResult, setCalcResult] = useState<ReturnType<typeof calculateLoan> | null>(null);
  const [disbursed, setDisbursed] = useState(false);
  const [disbursedCaseId, setDisbursedCaseId] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);

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

  const handleDisburse = () => {
    if (!calcResult || !calcResult.isValid) return;
    const je = createDisbursementJournal(
      calcResult.caseId,
      calcResult.netDisbursement,
      calcResult.fileChargesAmount,
      'Swetha Nair'
    );
    if (!je.isBalanced) {
      alert('⚠️ Journal entry is not balanced. Disbursement blocked (ACID guard).');
      return;
    }
    const loanCase: LoanCase = {
      id: calcResult.caseId,
      customerId: form.selectedCustomerId || 'CUS-NEW',
      customerName: form.selectedCustomerName || form.customerSearch,
      agentId: form.selectedAgentId,
      agentName: form.selectedAgentName,
      loanType: form.loanType,
      product: form.product,
      financeAmount: Number(form.financeAmount),
      interestAmount: Number(form.interestAmount),
      fileCharges: Number(form.fileCharges),
      fileChargesType: form.fileChargesType,
      netDisbursement: calcResult.netDisbursement,
      totalReceivable: calcResult.totalReceivable,
      numberOfInstallments: Number(form.numberOfInstallments),
      initialInstallment: Number(form.initialInstallment),
      restInstallment: Number(form.restInstallment),
      startDate: form.startDate,
      endDate: calcResult.endDate,
      frequency: form.frequency,
      fineAmount: Number(form.fineAmount),
      fineType: form.fineType,
      fineTriggerDays: Number(form.fineTriggerDays),
      schedule: calcResult.schedule,
      guarantors: form.guarantorName ? [{
        id: `GUA-${Date.now()}`,
        caseId: calcResult.caseId,
        name: form.guarantorName,
        phone: form.guarantorPhone,
        aadhaar: form.guarantorAadhaar || 'XXXX-XXXX-XXXX',
        pan: form.guarantorPan || 'XXXXXXXXXX',
        address: form.guarantorAddress,
        relationship: form.guarantorRelation,
        liabilityAgreementSigned: form.liabilityAgreementSigned,
        signedAt: new Date().toISOString(),
      }] : [],
      collaterals: form.collateralDesc ? [{
        id: `COL-${Date.now()}`,
        caseId: calcResult.caseId,
        type: form.collateralType as any,
        description: form.collateralDesc,
        estimatedValue: Number(form.collateralValue) || 0,
        documents: [],
      }] : [],
      status: 'active',
      disbursedAt: new Date().toISOString(),
      disbursedBy: 'Swetha Nair',
      journalEntries: [je],
      auditLog: [],
      createdAt: new Date().toISOString(),
    };
    addLoanCase(loanCase);
    setDisbursedCaseId(calcResult.caseId);
    setDisbursed(true);
  };

  if (disbursed) {
    return <DisburseSuccess caseId={disbursedCaseId} calcResult={calcResult!} form={form} onNew={() => { setDisbursed(false); setStep(1); setForm(defaultForm); setCalcResult(null); }} />;
  }

  return (
    <div className="fade-in-up" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>New Loan Case — Case Creation Wizard</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Multi-step ACID-compliant loan origination with immutable schedule generation</p>
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

      {/* Step Content */}
      <div className="card" style={{ marginBottom: 16, minHeight: 400 }}>
        {step === 1 && <Step1EntityMapping form={form} set={set} />}
        {step === 2 && <Step2Financials form={form} set={set} calcResult={calcResult} onCalculate={runCalculate} />}
        {step === 3 && <Step3Schedule calcResult={calcResult} form={form} />}
        {step === 4 && <Step4Penalty form={form} set={set} />}
        {step === 5 && <Step5KYC form={form} set={set} />}
        {step === 6 && <Step6Guarantor form={form} set={set} />}
        {step === 7 && calcResult && <Step7Review form={form} calcResult={calcResult} onDisburse={handleDisburse} />}
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
  const [customerFilter, setCustomerFilter] = useState('');
  const filtered = mockCustomers.filter(c => c.name.toLowerCase().includes(customerFilter.toLowerCase()) || c.phone.includes(customerFilter));

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Step 1 — Entity Mapping</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Customer Selection */}
        <div>
          <div className="input-label">Customer Name / Phone</div>
          <input className="input" placeholder="Search customer..." value={customerFilter}
            onChange={e => { setCustomerFilter(e.target.value); set('customerSearch', e.target.value); }} />
          {customerFilter && (
            <div style={{ border: '1px solid var(--bg-border)', borderRadius: 8, marginTop: 4, overflow: 'hidden' }}>
              {filtered.slice(0, 5).map(c => (
                <div key={c.id} onClick={() => { set('selectedCustomerId', c.id); set('selectedCustomerName', c.name); set('customerSearch', c.name); setCustomerFilter(''); }}
                  className="nav-item" style={{ borderRadius: 0, fontSize: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.id} · {c.phone} · {c.aadhaar}</div>
                  </div>
                </div>
              ))}
              <div className="nav-item" style={{ borderRadius: 0, fontSize: 12, borderTop: '1px solid var(--bg-border)' }}
                onClick={() => { set('selectedCustomerName', customerFilter); setCustomerFilter(''); }}>
                <Plus size={11} /> Create new customer "{customerFilter}"
              </div>
            </div>
          )}
          {form.selectedCustomerName && !customerFilter && (
            <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(16,185,129,0.1)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={14} color="#34d399" />
              <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>{form.selectedCustomerName}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{form.selectedCustomerId}</span>
            </div>
          )}
        </div>

        {/* Agent Selection */}
        <div>
          <div className="input-label">Assigned Agent</div>
          <select className="select" style={{ width: '100%' }} value={form.selectedAgentId}
            onChange={e => { const a = mockAgents.find(ag => ag.id === e.target.value); set('selectedAgentId', e.target.value); set('selectedAgentName', a?.name || ''); }}>
            <option value="">-- Select Agent --</option>
            {mockAgents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.branch}) — {a.commissionRate}%</option>)}
          </select>
        </div>

        {/* Loan Type */}
        <div>
          <div className="input-label">Loan Type / Frequency</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['daily', 'weekly', 'fortnightly', 'monthly'] as const).map(t => (
              <button key={t} className={`btn btn-sm ${form.loanType === t ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { set('loanType', t); set('frequency', t); }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Product */}
        <div>
          <div className="input-label">Loan Product</div>
          <select className="select" style={{ width: '100%' }} value={form.product} onChange={e => set('product', e.target.value)}>
            <option>Daily 100-Day Loan</option>
            <option>Weekly 26-Week Loan</option>
            <option>Monthly 12-Month Loan</option>
            <option>Monthly 24-Month Loan</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Financials ───────────────────────────────────────
function Step2Financials({ form, set, calcResult, onCalculate }: any) {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Step 2 — Financials & Calculation Engine</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {[
          { label: 'Finance Amount (₹)', key: 'financeAmount', placeholder: '50000' },
          { label: 'Interest Amount (₹)', key: 'interestAmount', placeholder: '5000' },
          { label: 'Number of Installments', key: 'numberOfInstallments', placeholder: '100' },
          { label: 'Initial Installment (₹)', key: 'initialInstallment', placeholder: '600 (first payment)' },
          { label: 'Rest Installment (₹)', key: 'restInstallment', placeholder: '550 (remaining payments)' },
          { label: 'File Charges (₹/%)', key: 'fileCharges', placeholder: '500' },
        ].map(f => (
          <div key={f.key}>
            <div className="input-label">{f.label}</div>
            <input className="input" type="number" placeholder={f.placeholder} value={(form as any)[f.key]}
              onChange={e => set(f.key, e.target.value)} />
          </div>
        ))}
        <div>
          <div className="input-label">File Charges Type</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['fixed', 'percentage'] as const).map(t => (
              <button key={t} className={`btn btn-sm ${form.fileChargesType === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => set('fileChargesType', t)}>
                {t === 'fixed' ? '₹ Fixed' : '% Rate'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="input-label">Charges Deducted From</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {([['disbursement', 'Disbursement'], ['loan', 'Added to Loan']] as const).map(([val, label]) => (
              <button key={val} className={`btn btn-sm ${form.chargesDeductedFrom === val ? 'btn-primary' : 'btn-secondary'}`} onClick={() => set('chargesDeductedFrom', val)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="input-label">Start Date</div>
          <input className="input" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
        </div>
      </div>

      <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onCalculate}>
        <Calculator size={14} /> Calculate Loan Schedule
      </button>

      {calcResult && (
        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          {[
            { label: 'Total Receivable', val: `₹${calcResult.totalReceivable.toLocaleString()}`, color: '#a5b4fc' },
            { label: 'Net Disbursement', val: `₹${calcResult.netDisbursement.toLocaleString()}`, color: '#34d399' },
            { label: 'File Charges', val: `₹${calcResult.fileChargesAmount.toLocaleString()}`, color: '#fbbf24' },
            { label: 'Checksum', val: `₹${calcResult.checksum.toLocaleString()}`, color: calcResult.isValid ? '#34d399' : '#f87171' },
            { label: 'End Date', val: calcResult.endDate, color: '#22d3ee' },
          ].map((item, i) => (
            <div key={i} style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: item.color }}>{item.val}</div>
            </div>
          ))}
        </div>
      )}
      {calcResult && !calcResult.isValid && (
        <div className="alert alert-danger" style={{ marginTop: 12, borderRadius: 10 }}>
          <AlertTriangle size={13} />
          <div>{calcResult.validationErrors.map((e: string, i: number) => <div key={i}>{e}</div>)}</div>
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
      <div style={{ color: 'var(--text-muted)' }}>Go back to Step 2 and click "Calculate Loan Schedule" first.</div>
    </div>
  );

  const schedule = calcResult.schedule;
  const show = schedule.slice(0, 20);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Step 3 — Repayment Schedule (Immutable)</div>
        <div className="alert alert-info" style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11 }}>
          <Lock size={11} /> Once disbursed, schedule is locked
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        {[
          { label: 'Total Installments', val: schedule.length },
          { label: 'Total Receivable', val: `₹${calcResult.totalReceivable.toLocaleString()}` },
          { label: 'Frequency', val: form.frequency },
          { label: 'End Date', val: calcResult.endDate },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{s.val}</div>
          </div>
        ))}
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        <table className="data-table" style={{ fontSize: 12 }}>
          <thead><tr><th>#</th><th>Due Date</th><th>Amount (₹)</th><th>Principal</th><th>Interest</th></tr></thead>
          <tbody>
            {show.map((r: any) => (
              <tr key={r.no}>
                <td style={{ color: 'var(--text-muted)' }}>{r.no}</td>
                <td className="mono">{r.dueDate}</td>
                <td style={{ fontWeight: 700, color: '#fbbf24' }}>₹{r.amount.toLocaleString()}</td>
                <td>₹{r.principal.toLocaleString()}</td>
                <td style={{ color: '#f87171' }}>₹{r.interest.toLocaleString()}</td>
              </tr>
            ))}
            {schedule.length > 20 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, padding: 12 }}>... and {schedule.length - 20} more installments</td></tr>
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
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Step 4 — Penalty & Fine Logic</div>
      <div className="alert alert-warning" style={{ marginBottom: 20, borderRadius: 10 }}>
        <Info size={13} />
        <span style={{ fontSize: 12 }}>Any change to fine amount or installment date after disbursement will be logged in the Audit Trail with User ID and Reason.</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div>
          <div className="input-label">Fine Amount (₹)</div>
          <input className="input" type="number" value={form.fineAmount} onChange={e => set('fineAmount', e.target.value)} />
        </div>
        <div>
          <div className="input-label">Fine Type</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`btn btn-sm ${form.fineType === 'per_day' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => set('fineType', 'per_day')}>Per Day</button>
            <button className={`btn btn-sm ${form.fineType === 'one_time' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => set('fineType', 'one_time')}>One-Time</button>
          </div>
        </div>
        <div>
          <div className="input-label">Grace Period (days before fine triggers)</div>
          <input className="input" type="number" value={form.fineTriggerDays} onChange={e => set('fineTriggerDays', e.target.value)} />
        </div>
        <div>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Fine Preview</div>
            {form.fineType === 'per_day' ? (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                If overdue by <strong>10 days</strong> (after {form.fineTriggerDays}-day grace):
                <div style={{ fontSize: 18, fontWeight: 800, color: '#f87171', marginTop: 6 }}>
                  Fine = ₹{Number(form.fineAmount) * (10 - Number(form.fineTriggerDays))}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                One-time fine after {form.fineTriggerDays}-day grace:
                <div style={{ fontSize: 18, fontWeight: 800, color: '#f87171', marginTop: 6 }}>Fine = ₹{Number(form.fineAmount)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 5: KYC & Collateral ─────────────────────────────────
function Step5KYC({ form, set }: any) {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Step 5 — Collateral & Extended KYC</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* KYC documents */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>Customer KYC Documents</div>
          {[
            { label: 'Aadhaar Card (Front)', key: 'aadhaarFront' },
            { label: 'PAN Card', key: 'panFile' },
            { label: 'Digital Signature', key: 'digitalSig' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 12 }}>
              <div className="input-label">{f.label}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1, border: '2px dashed var(--bg-border)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                  onClick={() => set(f.key, `uploaded_${f.key}.pdf`)}>
                  <Upload size={14} color="var(--text-muted)" />
                  <span style={{ fontSize: 12, color: (form as any)[f.key] ? '#34d399' : 'var(--text-muted)' }}>
                    {(form as any)[f.key] ? `✓ ${(form as any)[f.key]}` : 'Click to upload / capture'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Collateral */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>Collateral Details</div>
          <div style={{ marginBottom: 12 }}>
            <div className="input-label">Collateral Type</div>
            <select className="select" style={{ width: '100%' }} value={form.collateralType} onChange={e => set('collateralType', e.target.value)}>
              <option value="property">Property / Land</option>
              <option value="vehicle">Vehicle (RC Book)</option>
              <option value="gold">Gold / Jewellery</option>
              <option value="fd">Fixed Deposit</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div className="input-label">Description</div>
            <input className="input" placeholder="e.g. Residential flat at 12A Lokhandwala..." value={form.collateralDesc} onChange={e => set('collateralDesc', e.target.value)} />
          </div>
          <div>
            <div className="input-label">Estimated Value (₹)</div>
            <input className="input" type="number" placeholder="e.g. 2500000" value={form.collateralValue} onChange={e => set('collateralValue', e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 6: Guarantor ────────────────────────────────────────
function Step6Guarantor({ form, set }: any) {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Step 6 — Guarantor Management</div>
      <div className="alert alert-info" style={{ marginBottom: 16, borderRadius: 10 }}>
        <Users size={13} />
        <span style={{ fontSize: 12 }}>Guarantor details are stored as a separate legal entity linked to the Case ID. A Liability Agreement PDF is auto-generated upon confirmation.</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          { label: 'Guarantor Full Name', key: 'guarantorName', placeholder: 'As per Aadhaar' },
          { label: 'Phone Number', key: 'guarantorPhone', placeholder: '10-digit' },
          { label: 'Aadhaar Number', key: 'guarantorAadhaar', placeholder: '12-digit' },
          { label: 'PAN Number', key: 'guarantorPan', placeholder: 'ABCDE1234F' },
          { label: 'Full Address', key: 'guarantorAddress', placeholder: 'Guarantor residential address' },
        ].map(f => (
          <div key={f.key}>
            <div className="input-label">{f.label}</div>
            <input className="input" placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} />
          </div>
        ))}
        <div>
          <div className="input-label">Relationship with Borrower</div>
          <select className="select" style={{ width: '100%' }} value={form.guarantorRelation} onChange={e => set('guarantorRelation', e.target.value)}>
            {['Spouse', 'Parent', 'Sibling', 'Friend', 'Business Partner', 'Other'].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 10 }}>
        <div
          onClick={() => set('liabilityAgreementSigned', !form.liabilityAgreementSigned)}
          style={{ width: 44, height: 24, borderRadius: 12, background: form.liabilityAgreementSigned ? '#10b981' : 'var(--bg-border)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}
        >
          <div style={{ position: 'absolute', top: 3, left: form.liabilityAgreementSigned ? 23 : 3, width: 18, height: 18, borderRadius: 9, background: 'white', transition: 'left 0.2s' }} />
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Liability Agreement signed & verified by Guarantor
        </span>
        {form.liabilityAgreementSigned && (
          <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>
            <FileText size={11} /> Preview Agreement PDF
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 7: Review & Disburse ────────────────────────────────
function Step7Review({ form, calcResult, onDisburse }: any) {
  const [confirmed, setConfirmed] = useState(false);
  const branchCash = 420000;
  const canDisburse = branchCash >= calcResult.netDisbursement;

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Step 7 — Review & Disburse</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Summary */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Loan Summary</div>
          {[
            { label: 'Customer', val: form.selectedCustomerName || form.customerSearch },
            { label: 'Agent', val: form.selectedAgentName },
            { label: 'Product', val: form.product },
            { label: 'Finance Amount', val: `₹${Number(form.financeAmount).toLocaleString()}` },
            { label: 'Total Receivable', val: `₹${calcResult.totalReceivable.toLocaleString()}` },
            { label: 'Net Disbursement', val: `₹${calcResult.netDisbursement.toLocaleString()}`, highlight: true },
            { label: 'Installments', val: `${calcResult.schedule.length} × ${form.frequency}` },
            { label: 'Start → End', val: `${form.startDate} → ${calcResult.endDate}` },
            { label: 'Guarantor', val: form.guarantorName || '—' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--bg-border)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.label}</span>
              <span style={{ fontSize: 12, fontWeight: (item as any).highlight ? 800 : 600, color: (item as any).highlight ? '#34d399' : 'var(--text-primary)' }}>{item.val}</span>
            </div>
          ))}
        </div>

        {/* Disburse Panel */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Disbursement Guard Check</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'Branch Cash Available', val: `₹${branchCash.toLocaleString()}`, ok: true },
              { label: 'Net Disbursement Required', val: `₹${calcResult.netDisbursement.toLocaleString()}`, ok: canDisburse },
              { label: 'Balance After Disburse', val: `₹${(branchCash - calcResult.netDisbursement).toLocaleString()}`, ok: canDisburse },
              { label: 'Guarantor Signed', val: form.liabilityAgreementSigned ? 'Yes ✓' : 'No (optional)', ok: form.liabilityAgreementSigned },
              { label: 'Schedule Validity', val: calcResult.isValid ? 'Valid ✓' : 'Invalid ✗', ok: calcResult.isValid },
            ].map((check, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{check.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: check.ok ? '#34d399' : '#f87171' }}>{check.val}</span>
              </div>
            ))}
          </div>

          {/* Journal Preview */}
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#a5b4fc', marginBottom: 8 }}>Auto Journal Entry (on Disburse)</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#f87171' }}>Dr: Loan Portfolio (Principal)</span><span>₹{calcResult.netDisbursement.toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#34d399' }}>Cr: Branch Cash / Bank</span><span>₹{calcResult.netDisbursement.toLocaleString()}</span></div>
              {calcResult.fileChargesAmount > 0 && <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#f87171' }}>Dr: File Charges Receivable</span><span>₹{calcResult.fileChargesAmount}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#34d399' }}>Cr: Fee Income</span><span>₹{calcResult.fileChargesAmount}</span></div>
              </>}
            </div>
          </div>

          {!canDisburse && (
            <div className="alert alert-danger" style={{ borderRadius: 10, marginBottom: 12, fontSize: 11 }}>
              <Lock size={12} /> Insufficient branch cash — Disbursement blocked
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div onClick={() => setConfirmed(!confirmed)} style={{ width: 20, height: 20, borderRadius: 4, background: confirmed ? '#10b981' : 'var(--bg-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {confirmed && <CheckCircle2 size={13} color="white" />}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>I confirm all details are correct and authorize disbursement</span>
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }}
            disabled={!canDisburse || !confirmed || !calcResult.isValid}
            onClick={onDisburse}>
            <Lock size={14} /> 💸 Disburse Loan — ₹{calcResult.netDisbursement.toLocaleString()}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Disburse Success Screen ──────────────────────────────────
function DisburseSuccess({ caseId, calcResult, form, onNew }: any) {
  return (
    <div className="fade-in-up" style={{ maxWidth: 700, margin: '40px auto', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#34d399', marginBottom: 8 }}>Loan Disbursed Successfully!</div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Journal entry created · Schedule locked · Audit trail recorded</div>

      <div className="card" style={{ textAlign: 'left', marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Disbursement Receipt</div>
        {[
          ['Case ID', caseId],
          ['Customer', form.selectedCustomerName || form.customerSearch],
          ['Finance Amount', `₹${Number(form.financeAmount).toLocaleString()}`],
          ['Net Disbursement', `₹${calcResult.netDisbursement.toLocaleString()}`],
          ['Total Receivable', `₹${calcResult.totalReceivable.toLocaleString()}`],
          ['Installments', `${calcResult.schedule.length} × ${form.frequency}`],
          ['End Date', calcResult.endDate],
          ['Disbursed At', new Date().toLocaleString('en-IN')],
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--bg-border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{val}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button className="btn btn-secondary"><Printer size={13} /> Print Receipt</button>
        <button className="btn btn-success"><Send size={13} /> Send via WhatsApp</button>
        <button className="btn btn-primary" onClick={onNew}><Plus size={13} /> New Case</button>
      </div>
    </div>
  );
}
