'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, AlertTriangle, Loader2, User,
  FileText, Calendar, IndianRupee, ChevronRight, Package,
  Send
} from 'lucide-react';
import { customerService } from '@/services/customerService';
import { loanService } from '@/services/loanService';
import { productService, LoanProduct } from '@/services/productService';
import { apiClient } from '@/services/apiClient';

const FREQUENCY_LABELS: Record<number, string> = {
  0: 'Monthly', 1: 'Weekly', 2: 'Daily', 3: 'Bullet (Lump Sum)',
};
const FREQUENCY_COLORS: Record<number, string> = {
  0: '#6366f1', 1: '#10b981', 2: '#f59e0b', 3: '#ef4444',
};

function getTotalInstallments(tenureMonths: number, freq: number): number {
  switch (freq) {
    case 0: return tenureMonths;
    case 1: return Math.round((tenureMonths * 30) / 7);
    case 2: return tenureMonths * 30;
    case 3: return 1;
    default: return tenureMonths;
  }
}

interface ScheduleRow { no: number; dueDate: string; amount: number; }

function buildSchedule(totalPaise: number, freq: number, tenureMonths: number): ScheduleRow[] {
  const count = getTotalInstallments(tenureMonths, freq);
  if (count <= 0) return [];
  const emi = Math.round(totalPaise / count);
  const rows: ScheduleRow[] = [];
  let cur = new Date();
  for (let i = 1; i <= Math.min(count, 60); i++) {
    if (freq === 0) cur = new Date(cur.getFullYear(), cur.getMonth() + 1, cur.getDate());
    else if (freq === 1) cur = new Date(cur.getTime() + 7 * 86400000);
    else if (freq === 2) cur = new Date(cur.getTime() + 86400000);
    else cur = new Date(cur.getFullYear(), cur.getMonth() + tenureMonths, cur.getDate());
    rows.push({ no: i, dueDate: cur.toLocaleDateString('en-IN'), amount: emi });
    if (freq === 3) break;
  }
  return rows;
}

const fmt = (paise: number) =>
  'Rs.' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 });

type Step = 'customer' | 'product' | 'loan' | 'review' | 'success';

export default function NewCasePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);
  const [customerData, setCustomerData] = useState({ name: '', phone: '', aadhaar: '', pan: '', address: '' });
  const [loanData, setLoanData] = useState({ principal: '', interestRate: '', tenure: '', processingFeePercent: '2' });
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [createdLoan, setCreatedLoan] = useState<any>(null);

  useEffect(() => {
    setProductsLoading(true);
    productService.getAll().then(setProducts).catch(console.warn).finally(() => setProductsLoading(false));
  }, []);

  useEffect(() => {
    if (!loanData.principal || !loanData.tenure || !selectedProduct) { setSchedule([]); return; }
    const principal = parseFloat(loanData.principal) * 100;
    const rate = parseFloat(loanData.interestRate) || 0;
    const tenure = parseInt(loanData.tenure) || 0;
    if (principal <= 0 || tenure <= 0) { setSchedule([]); return; }
    const interest = Math.round(principal * (rate / 100));
    setSchedule(buildSchedule(principal + interest, selectedProduct.repaymentFrequency, tenure));
  }, [loanData, selectedProduct]);

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerData.name.trim() || !customerData.phone.trim() || !customerData.aadhaar.trim() || !customerData.pan.trim()) {
      setError('All fields marked * are required'); return;
    }
    setError(null); setStep('product');
  };

  const handleProductSelect = (product: LoanProduct) => {
    setSelectedProduct(product);
    setLoanData(prev => ({ ...prev, interestRate: product.interestRate.toString(), tenure: product.defaultTenureMonths.toString() }));
    setStep('loan');
  };

  const handleLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanData.principal || parseFloat(loanData.principal) <= 0) { setError('Enter a valid principal amount'); return; }
    setError(null); setStep('review');
  };

  const handleCreateLoan = async () => {
    try {
      setLoading(true); setError(null);
      const customer = await customerService.create({
        name: customerData.name, phone: customerData.phone,
        aadhaarEncrypted: customerData.aadhaar, panEncrypted: customerData.pan,
      });
      const principalPaise = Math.round(parseFloat(loanData.principal) * 100);
      const rate = parseFloat(loanData.interestRate) || 0;
      const interestPaise = Math.round(principalPaise * (rate / 100));
      const feePaise = Math.round(principalPaise * (parseFloat(loanData.processingFeePercent) / 100));
      const loan = await loanService.create({
        customerId: customer.id, principal: principalPaise,
        interestAmount: interestPaise, processingFees: feePaise,
      });
      try { await loanService.submitLoanForApproval(loan.id); } catch {}
      setCreatedLoan(loan); setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to create case');
    } finally { setLoading(false); }
  };

  const principalNum = parseFloat(loanData.principal) || 0;
  const rateNum = parseFloat(loanData.interestRate) || 0;
  const tenureNum = parseInt(loanData.tenure) || 0;
  const feeRateNum = parseFloat(loanData.processingFeePercent) || 0;
  const interestAmt = Math.round(principalNum * (rateNum / 100));
  const processingFee = Math.round(principalNum * (feeRateNum / 100));
  const totalPayable = principalNum + interestAmt;
  const emiCount = selectedProduct ? getTotalInstallments(tenureNum, selectedProduct.repaymentFrequency) : tenureNum;
  const emi = emiCount > 0 ? Math.round((totalPayable * 100) / emiCount) : 0;

  const STEPS = ['customer', 'product', 'loan', 'review'];
  const stepIdx = STEPS.indexOf(step);

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.back()} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>New Loan Case</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Create a new loan application</p>
        </div>
      </div>

      {step !== 'success' && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
          {['Customer', 'Product', 'Loan Details', 'Review'].map((label, idx) => {
            const done = stepIdx > idx;
            const active = stepIdx === idx;
            return (
              <React.Fragment key={label}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 72 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: done ? '#10b981' : active ? '#6366f1' : 'var(--bg-elevated)',
                    color: (done || active) ? 'white' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 13,
                    border: active ? '2px solid #6366f1' : done ? '2px solid #10b981' : '2px solid var(--bg-border)',
                  }}>
                    {done ? <CheckCircle2 size={15} /> : idx + 1}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? '#6366f1' : done ? '#10b981' : 'var(--text-muted)' }}>{label}</span>
                </div>
                {idx < 3 && <div style={{ flex: 1, height: 2, background: done ? '#10b981' : 'var(--bg-border)', margin: '-12px 4px 12px 4px' }} />}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          <AlertTriangle size={15} /><span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>x</button>
        </div>
      )}

      {step === 'customer' && (
        <div className="card" style={{ maxWidth: 620, margin: '0 auto', padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <User size={18} color="#6366f1" />
            <div style={{ fontSize: 15, fontWeight: 700 }}>Customer Details</div>
          </div>
          <form onSubmit={handleCustomerSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Full Name *</label>
                <input className="input" placeholder="As per Aadhaar" value={customerData.name}
                  onChange={e => setCustomerData(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label className="input-label">Phone *</label>
                <input className="input" type="tel" placeholder="10-digit mobile" value={customerData.phone}
                  maxLength={10} onChange={e => setCustomerData(p => ({ ...p, phone: e.target.value }))} required />
              </div>
              <div>
                <label className="input-label">Address</label>
                <input className="input" placeholder="City, District" value={customerData.address}
                  onChange={e => setCustomerData(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Aadhaar Number *</label>
                <input className="input" placeholder="12 digits" value={customerData.aadhaar}
                  maxLength={12} onChange={e => setCustomerData(p => ({ ...p, aadhaar: e.target.value.replace(/\D/g, '') }))} required />
              </div>
              <div>
                <label className="input-label">PAN Number *</label>
                <input className="input" placeholder="e.g. ABCDE1234F" value={customerData.pan}
                  maxLength={10} onChange={e => setCustomerData(p => ({ ...p, pan: e.target.value.toUpperCase() }))} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Continue <ChevronRight size={14} />
            </button>
          </form>
        </div>
      )}

      {step === 'product' && (
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Package size={18} color="#6366f1" />
            <div style={{ fontSize: 15, fontWeight: 700 }}>Select Loan Product</div>
          </div>
          {productsLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={28} className="animate-spin" color="#6366f1" /></div>
          ) : products.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <Package size={32} color="var(--text-muted)" style={{ marginBottom: 10, opacity: 0.4 }} />
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>No products configured yet.</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => router.push('/loans/products')}>Configure Products</button>
                <button className="btn btn-primary" onClick={() => { setSelectedProduct(null); setStep('loan'); }}>Continue Without Product</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {products.map(p => {
                const color = FREQUENCY_COLORS[p.repaymentFrequency];
                return (
                  <div key={p.id} className="card"
                    onClick={() => handleProductSelect(p)}
                    style={{ cursor: 'pointer', borderLeft: `4px solid ${color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span style={{ background: `${color}18`, color, padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                            {FREQUENCY_LABELS[p.repaymentFrequency]}
                          </span>
                          <span style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 5, fontSize: 10 }}>{p.code}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 24, fontWeight: 900, color }}>{p.interestRate}%</div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>p.a.</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ background: 'var(--bg-elevated)', borderRadius: 6, padding: '6px 10px' }}>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>DEFAULT TENURE</div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{p.defaultTenureMonths} Months</div>
                      </div>
                      <div style={{ background: 'var(--bg-elevated)', borderRadius: 6, padding: '6px 10px' }}>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>INSTALLMENTS</div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{getTotalInstallments(p.defaultTenureMonths, p.repaymentFrequency)}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: 10, color, fontSize: 11, fontWeight: 700 }}>Select &rarr;</div>
                  </div>
                );
              })}
            </div>
          )}
          <button className="btn btn-secondary" style={{ marginTop: 14 }} onClick={() => setStep('customer')}>
            <ArrowLeft size={13} /> Back
          </button>
        </div>
      )}

      {step === 'loan' && (
        <div className="card" style={{ maxWidth: 620, margin: '0 auto', padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <IndianRupee size={18} color="#6366f1" />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Loan Details</div>
              {selectedProduct && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Product: <strong style={{ color: '#6366f1' }}>{selectedProduct.name}</strong>
                  &nbsp;·&nbsp;{FREQUENCY_LABELS[selectedProduct.repaymentFrequency]}
                </div>
              )}
            </div>
          </div>
          <form onSubmit={handleLoanSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Principal Amount (Rs.) *</label>
                <input className="input" type="number" placeholder="e.g. 50000" value={loanData.principal}
                  onChange={e => setLoanData(p => ({ ...p, principal: e.target.value }))} required min="1" />
              </div>
              <div>
                <label className="input-label">Interest Rate (% p.a.)</label>
                <input className="input" type="number" step="0.1" value={loanData.interestRate}
                  onChange={e => setLoanData(p => ({ ...p, interestRate: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Tenure (Months)</label>
                <input className="input" type="number" value={loanData.tenure}
                  onChange={e => setLoanData(p => ({ ...p, tenure: e.target.value }))} min="1" />
              </div>
              <div>
                <label className="input-label">Processing Fee (%)</label>
                <input className="input" type="number" step="0.1" value={loanData.processingFeePercent}
                  onChange={e => setLoanData(p => ({ ...p, processingFeePercent: e.target.value }))} />
              </div>
              {selectedProduct && (
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 3 }}>REPAYMENT FREQUENCY</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: FREQUENCY_COLORS[selectedProduct.repaymentFrequency] }}>
                    {FREQUENCY_LABELS[selectedProduct.repaymentFrequency]}
                  </div>
                </div>
              )}
            </div>

            {principalNum > 0 && (
              <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', marginBottom: 10 }}>Loan Summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {[
                    { label: 'Principal', val: `Rs.${principalNum.toLocaleString()}`, color: '#6366f1' },
                    { label: 'Interest', val: `Rs.${interestAmt.toLocaleString()}`, color: '#f59e0b' },
                    { label: 'Processing Fee', val: `Rs.${processingFee.toLocaleString()}`, color: '#ef4444' },
                    { label: 'Total Payable', val: `Rs.${totalPayable.toLocaleString()}`, color: '#10b981' },
                    { label: 'Installments', val: emiCount > 0 ? `${emiCount}` : 'N/A', color: '#6366f1' },
                    { label: 'Per Installment', val: emi > 0 ? `Rs.${(emi/100).toLocaleString()}` : 'N/A', color: '#10b981' },
                  ].map((item, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {schedule.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={13} color="#6366f1" /> Schedule Preview
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>(first {Math.min(schedule.length, 10)} of {emiCount})</span>
                </div>
                <div style={{ border: '1px solid var(--bg-border)', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-elevated)' }}>
                        {['#', 'Due Date', 'Amount'].map(h => (
                          <th key={h} style={{ padding: '5px 10px', textAlign: h === 'Amount' ? 'right' : 'left', fontWeight: 600, color: 'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.slice(0, 10).map(row => (
                        <tr key={row.no} style={{ borderTop: '1px solid var(--bg-border)' }}>
                          <td style={{ padding: '4px 10px', color: 'var(--text-muted)' }}>{row.no}</td>
                          <td style={{ padding: '4px 10px', fontFamily: 'monospace' }}>{row.dueDate}</td>
                          <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{fmt(row.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep('product')}>
                <ArrowLeft size={13} /> Back
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                Review Case <ChevronRight size={13} />
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 'review' && (
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <FileText size={18} color="#6366f1" />
              <div style={{ fontSize: 15, fontWeight: 700 }}>Review Application</div>
            </div>

            <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>Customer</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['Name', customerData.name],
                  ['Phone', customerData.phone],
                  ['Aadhaar', '****' + customerData.aadhaar.slice(-4)],
                  ['PAN', customerData.pan],
                ].map(([l, v]) => (
                  <div key={l}><div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{l}</div><div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div></div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>Loan Terms</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['Product', selectedProduct?.name || 'Custom'],
                  ['Frequency', selectedProduct ? FREQUENCY_LABELS[selectedProduct.repaymentFrequency] : 'Monthly'],
                  ['Principal', `Rs.${principalNum.toLocaleString()}`],
                  [`Interest (${rateNum}%)`, `Rs.${interestAmt.toLocaleString()}`],
                  ['Processing Fee', `Rs.${processingFee.toLocaleString()}`],
                  ['Total Payable', `Rs.${totalPayable.toLocaleString()}`],
                  ['Tenure', `${tenureNum} Months`],
                  ['Installments', `${emiCount} x Rs.${(emi/100).toLocaleString()}`],
                ].map(([l, v]) => (
                  <div key={l}><div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{l}</div><div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div></div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: 'rgba(99,102,241,0.06)', borderRadius: 8, marginBottom: 18, border: '1px solid rgba(99,102,241,0.15)' }}>
              <Send size={13} color="#6366f1" style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                <strong>Workflow:</strong> Loan will be DRAFT then auto-submitted as PENDING APPROVAL. Branch manager must approve before disbursement.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setStep('loan')}>
                <ArrowLeft size={13} /> Edit
              </button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleCreateLoan} disabled={loading}>
                {loading ? <><Loader2 className="animate-spin" size={13} /> Creating...</> : <><Send size={13} /> Submit Application</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="card" style={{ maxWidth: 500, margin: '0 auto', padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>🎉</div>
          <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 8, color: '#10b981' }}>Loan Case Created!</h2>
          <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: 16, marginBottom: 22 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>LOAN CODE</div>
            <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'monospace', color: '#10b981', letterSpacing: 2 }}>
              {createdLoan?.loanCode || 'Generated'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
              Status: <strong style={{ color: '#f59e0b' }}>Pending Approval</strong>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => router.push('/loans/applications')}>View All Cases</button>
            <button className="btn btn-secondary" onClick={() => {
              setStep('customer');
              setCustomerData({ name: '', phone: '', aadhaar: '', pan: '', address: '' });
              setLoanData({ principal: '', interestRate: '', tenure: '', processingFeePercent: '2' });
              setSelectedProduct(null); setCreatedLoan(null); setError(null);
            }}>Create Another</button>
          </div>
        </div>
      )}
    </div>
  );
}
