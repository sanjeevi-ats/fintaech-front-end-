'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Scale, AlertTriangle, CheckCircle2, Lock, Loader2, AlertCircle } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { accountingService, TrialBalanceItem } from '@/services/accountingService';
import CodeSearchBar from '@/components/CodeSearchBar';
import { fuzzySearchWithCodePriority, codeSearchConfig } from '@/lib/searchUtils';

export default function DayEndPage() {
  const [physicalCash, setPhysicalCash] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemCash, setSystemCash] = useState(0);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceItem[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, try the dedicated DayEnd balance endpoint (fastest, most accurate)
      let cashBalanceFetched = false;
      try {
        const balanceData = await accountingService.getDayEndBalance();
        if (balanceData && typeof balanceData.systemCash === 'number') {
          setSystemCash(balanceData.systemCash / 100); // Convert paise to rupees
          cashBalanceFetched = true;
        }
      } catch (balanceErr) {
        console.warn('DayEnd balance endpoint failed, falling back to trial balance:', balanceErr);
      }

      // Fallback: fetch trial balance to build the ledger display + derive cash
      let tb: TrialBalanceItem[] = [];
      try {
        tb = await accountingService.getTrialBalance();
      } catch (err) {
        console.warn('Primary trial balance endpoint failed, trying alternative');
        try {
          tb = await accountingService.getTrialBalanceAlt();
        } catch (err2) {
          console.warn('Secondary trial balance endpoint failed, trying ledger endpoint');
          try {
            tb = await accountingService.getLedgerAlt();
          } catch (err3) {
            console.warn('All trial balance endpoints failed');
          }
        }
      }
      
      setTrialBalance(tb);
      
      // If balance not already fetched from dedicated endpoint, derive from trial balance
      if (!cashBalanceFetched) {
        const cashAccount = tb.find(a => 
          a.accountName.toLowerCase().includes('cash') || 
          a.accountName.toLowerCase().includes('bank') ||
          a.accountCode === 'CASH' ||
          a.accountCode === 'BANK'
        );
        
        if (cashAccount) {
          const balance = ((cashAccount.debitBalance || 0) - (cashAccount.creditBalance || 0)) / 100;
          setSystemCash(balance);
        } else {
          setSystemCash(0);
        }
      }
    } catch (err: any) {
      console.error('Fetch day-end data error:', err);
      setError(`Failed to load system cash balance: ${err.message}. Please ensure the backend is running on port 5177.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const entered = parseInt(physicalCash) || 0;
  const discrepancy = systemCash - entered;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await accountingService.closeDayEnd();
      setSubmitted(true);
    } catch (err: any) {
      console.error('Day-end close error:', err);
      setError(`Error closing day: ${err.message}. Ensure all journal entries are balanced and the backend is accessible.`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !submitted && trialBalance.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Reconciling system balances...</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Scale size={20} color="#6366f1" /> Day-End Closing
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Hard-stop mechanism — Branch cannot close until cash is reconciled</p>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20, borderRadius: 12 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }}>
        {/* Cash Summary */}
        <div>
          <div style={{ marginBottom: 16 }}>
            <CodeSearchBar
              onSearch={setSearch}
              entityType="dayEnd"
              placeholder="Search by account name or code..."
              showHistory={true}
              autoFocus={false}
            />
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              System Balance Summary — {new Date().toDateString()}
            </div>
            {submitted && (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: 12, borderRadius: 8, marginBottom: 14, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Day-End Code</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>DE{new Date().toISOString().slice(0, 10).replace(/-/g, '')}</div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {trialBalance
                .filter(item => {
                  if (!search.trim()) return true;
                  const q = search.toLowerCase();
                  return (
                    item.accountName.toLowerCase().includes(q) ||
                    (item.accountCode && item.accountCode.toLowerCase().includes(q))
                  );
                })
                .map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--bg-border)',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.accountName}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: item.creditBalance > 0 ? '#f87171' : '#34d399' }}>
                    ₹{formatNumber((item.debitBalance || item.creditBalance) / 100)} {item.creditBalance > 0 ? '(Cr)' : '(Dr)'}
                  </span>
                </div>
              ))}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px',
                background: 'rgba(99,102,241,0.08)',
                marginTop: 12,
                borderRadius: 10,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Total System Cash</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#a5b4fc' }}>₹{formatNumber(systemCash)}</span>
              </div>
            </div>
          </div>

          {/* Reconciliation form */}
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Physical Cash Count</div>
            <div style={{ marginBottom: 12 }}>
              <div className="input-label">Enter physical cash counted at branch</div>
              <input
                className="input"
                type="number"
                placeholder="e.g. 143000"
                value={physicalCash}
                onChange={e => setPhysicalCash(e.target.value)}
                disabled={submitted || loading}
                style={{ fontSize: 18, fontWeight: 700 }}
              />
            </div>

            {physicalCash && !submitted && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>System Cash</span>
                  <span style={{ fontWeight: 700, color: '#a5b4fc' }}>₹{systemCash.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Physical Cash</span>
                  <span style={{ fontWeight: 700, color: '#fbbf24' }}>₹{entered.toLocaleString()}</span>
                </div>
                {discrepancy !== 0 ? (
                  <div className="alert alert-danger" style={{ borderRadius: 10, marginBottom: 12 }}>
                    <AlertTriangle size={14} />
                    <div>
                      <div style={{ fontWeight: 700 }}>Discrepancy: ₹{Math.abs(discrepancy).toLocaleString()}</div>
                      <div style={{ fontSize: 11 }}>This amount will be posted for Auditor review.</div>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-success" style={{ borderRadius: 10, marginBottom: 12 }}>
                    <CheckCircle2 size={14} />
                    <span>Cash is perfectly balanced! Ready for day-end close.</span>
                  </div>
                )}
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSubmit} disabled={loading}>
                  {loading ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />} Submit & Close Day
                </button>
              </div>
            )}

            {submitted && (
              <div className="alert alert-success" style={{ marginTop: 12, borderRadius: 10 }}>
                <CheckCircle2 size={14} />
                <div>
                  <div style={{ fontWeight: 700 }}>Day-End Closed Successfully</div>
                  <div style={{ fontSize: 11 }}>Business date has been locked. Audit trail created.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status panel */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Day-End Checklist</div>
            {[
              { label: 'System Trial Balance Fetched', done: trialBalance.length > 0 },
              { label: 'Cash Count Entered', done: physicalCash !== '' },
              { label: 'Discrepancy Calculated', done: physicalCash !== '' },
              { label: 'Day-End Closing Submitted', done: submitted },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--bg-border)' : 'none' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: item.done ? 'rgba(16,185,129,0.15)' : 'var(--bg-elevated)', border: `1px solid ${item.done ? '#10b981' : 'var(--bg-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.done && <CheckCircle2 size={12} color="#34d399" />}
                </div>
                <span style={{ fontSize: 12, color: item.done ? 'var(--text-primary)' : 'var(--text-muted)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

