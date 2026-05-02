'use client';
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Scale, Loader2, AlertTriangle } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { accountingService, TrialBalanceItem, PnLStatement, JournalEntry } from '@/services/accountingService';

export default function GeneralLedgerPage() {
  const [view, setView] = useState<'ledger' | 'balance' | 'pl'>('ledger');
  const [trialBalance, setTrialBalance] = useState<TrialBalanceItem[]>([]);
  const [pnlStatement, setPnlStatement] = useState<PnLStatement | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccountingData();
  }, []);

  const loadAccountingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

      // Try primary endpoints first, then fallback to alternatives
      let trialBalanceData: TrialBalanceItem[];
      let pnlData: PnLStatement | null = null;
      let journalData: JournalEntry[];

      try {
        trialBalanceData = await accountingService.getTrialBalance();
      } catch (err) {
        console.warn('Primary trial balance endpoint failed, trying alternatives');
        try {
          trialBalanceData = await accountingService.getTrialBalanceAlt();
        } catch (err2) {
          console.warn('Secondary trial balance endpoint failed, trying ledger endpoint');
          trialBalanceData = await accountingService.getLedgerAlt();
        }
      }

      try {
        pnlData = await accountingService.getPnLStatement(startOfMonth, endOfMonth);
      } catch (err) {
        console.warn('Primary P&L endpoint failed, trying alternative');
        try {
          pnlData = await accountingService.getPnLStatementAlt(startOfMonth, endOfMonth);
        } catch (altErr) {
          console.warn('Both P&L endpoints failed, continuing without P&L data');
        }
      }

      try {
        journalData = await accountingService.getJournalEntries(startOfMonth, endOfMonth);
      } catch (err) {
        console.warn('Journal entries endpoint failed, using empty array');
        journalData = [];
      }

      setTrialBalance(trialBalanceData);
      setPnlStatement(pnlData);
      setJournalEntries(journalData);
    } catch (err: any) {
      console.error('Load accounting data error:', err);
      setError(`Failed to load accounting data: ${err.message}. Please check if the backend is running on port 5177.`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fade-in-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <Loader2 className="animate-spin" size={32} />
        <span style={{ marginLeft: 12 }}>Loading accounting data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in-up">
        <div className="alert alert-danger">
          <AlertTriangle size={16} />
          Error loading accounting data: {error}
          <button className="btn btn-secondary btn-sm" onClick={loadAccountingData} style={{ marginLeft: 12 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate totals for balance sheet
  const totalAssets = trialBalance
    .filter(item => item.debitBalance > 0)
    .reduce((sum, item) => sum + item.debitBalance, 0);
  
  const totalLiabilities = trialBalance
    .filter(item => item.creditBalance > 0)
    .reduce((sum, item) => sum + item.creditBalance, 0);

  // Mock data for balance sheet structure (when API data is not available)
  const bs = {
    assets: {
      cashInHand: totalAssets * 0.1,
      bankBalance: totalAssets * 0.2,
      loanPortfolio: totalAssets * 0.6,
      fileChargesReceivable: totalAssets * 0.1,
      totalAssets: totalAssets
    },
    liabilities: {
      partnerCapital: totalLiabilities * 0.8,
      suspenseAccount: totalLiabilities * 0.1,
      provisionBadDebt: totalLiabilities * 0.1,
      totalLiabilities: totalLiabilities
    },
    equity: {
      retainedEarnings: totalLiabilities * 0.3,
      currentPeriodProfit: pnlStatement?.netProfit || 0,
      totalEquity: totalLiabilities * 0.3 + (pnlStatement?.netProfit || 0)
    }
  };

  // Mock data for P&L structure (when API data is not available)
  const pl = pnlStatement || {
    income: {
      interestReceived: 5000000,
      fileChargesIncome: 500000,
      finesReceived: 200000,
      totalIncome: 5700000
    },
    expenses: {
      agentCommissions: 800000,
      salaries: 1200000,
      operationalCosts: 600000,
      provisionBadDebt: 300000,
      totalExpenses: 2900000
    },
    netProfit: 2800000
  };

  // Mock trend data for charts
  const plTrend = [
    { month: 'Oct', income: 9200000, expenses: 7800000, profit: 1400000 },
    { month: 'Nov', income: 9820000, expenses: 7880000, profit: 1940000 },
    { month: 'Dec', income: 10440000, expenses: 7960000, profit: 2480000 },
    { month: 'Jan', income: 11060000, expenses: 8040000, profit: 3020000 },
    { month: 'Feb', income: 11680000, expenses: 8120000, profit: 3560000 },
    { month: 'Mar', income: 12300000, expenses: 8200000, profit: 4100000 },
  ];

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Real-Time General Ledger</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Live balance updates · Double-entry verified · ACID-compliant</p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', padding: 4, borderRadius: 10 }}>
          {[['ledger', 'Ledger'], ['balance', 'Balance Sheet'], ['pl', 'P&L Statement']].map(([k, label]) => (
            <button key={k} className={`btn btn-sm ${view === k ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: 8 }} onClick={() => setView(k as any)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── General Ledger ─── */}
      {view === 'ledger' && (
        <>
          {/* Summary KPIs */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Total Assets (Dr)', val: `₹${formatNumber(totalAssets / 100)}`, color: '#6366f1', sub: 'Debit balances' },
              { label: 'Total Liabilities (Cr)', val: `₹${formatNumber(totalLiabilities / 100)}`, color: '#f59e0b', sub: 'Credit balances' },
              { label: 'Journal Entries', val: journalEntries.length.toString(), color: '#10b981', sub: 'Current period' },
              { label: 'Net Profit (MTD)', val: pnlStatement ? `₹${formatNumber(pnlStatement.netProfit / 100)}` : 'N/A', color: '#8b5cf6', sub: 'Current month' },
            ].map((item, i) => (
              <div key={i} className="card" style={{ flex: 1, padding: 18 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{item.sub}</div>
              </div>
            ))}
          </div>

          {/* Journal Entries Table */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--bg-border)' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Recent Journal Entries</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Each transaction auto-creates a balanced Dr/Cr journal entry</div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 16, paddingTop: 14, paddingBottom: 14 }}>Entry ID</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Debit Account</th>
                  <th>Credit Account</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {journalEntries.length > 0 ? journalEntries.slice(0, 10).map(entry => (
                  <tr key={entry.id}>
                    <td className="mono primary" style={{ paddingLeft: 16 }}>{entry.id.slice(0, 12)}...</td>
                    <td className="mono" style={{ fontSize: 11 }}>{new Date(entry.date).toLocaleDateString()}</td>
                    <td style={{ fontSize: 12 }}>{entry.description}</td>
                    <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
                      <span style={{ color: '#f87171', fontSize: 12 }}>{entry.debitAccount}</span>
                    </span></td>
                    <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} />
                      <span style={{ color: '#34d399', fontSize: 12 }}>{entry.creditAccount}</span>
                    </span></td>
                    <td style={{ fontWeight: 700, color: '#fbbf24' }}>₹{(entry.amount / 100).toLocaleString()}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      No journal entries found for the current period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── Trial Balance ─── */}
      {view === 'balance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Assets (Debit Balances) */}
          <div className="card">
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color="#6366f1" /> Assets (Dr)
            </div>
            {trialBalance.filter(item => item.debitBalance > 0).map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--bg-border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.accountName}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{formatNumber(item.debitBalance / 100)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', marginTop: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>TOTAL ASSETS</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#6366f1' }}>₹{formatNumber(totalAssets / 100)}</span>
            </div>
          </div>

          {/* Liabilities (Credit Balances) */}
          <div className="card">
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingDown size={16} color="#f59e0b" /> Liabilities & Equity (Cr)
            </div>
            {trialBalance.filter(item => item.creditBalance > 0).map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--bg-border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.accountName}</span>
                <span style={{ fontWeight: 600, color: '#fbbf24' }}>₹{formatNumber(item.creditBalance / 100)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', marginTop: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>TOTAL LIABILITIES</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#f59e0b' }}>₹{formatNumber(totalLiabilities / 100)}</span>
            </div>
          </div>

          {/* Accounting Equation Check */}
          <div className="card" style={{ gridColumn: '1 / -1', background: 'rgba(99,102,241,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 40, alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>TOTAL ASSETS</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#6366f1' }}>₹{formatNumber(totalAssets / 100)}</div>
              </div>
              <div style={{ fontSize: 24, color: 'var(--text-muted)' }}>=</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>LIABILITIES & EQUITY</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b' }}>₹{formatNumber(totalLiabilities / 100)}</div>
              </div>
              <div style={{ padding: '6px 14px', background: totalAssets === totalLiabilities ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', borderRadius: 8, fontSize: 12, fontWeight: 700, color: totalAssets === totalLiabilities ? '#34d399' : '#f87171' }}>
                {totalAssets === totalLiabilities ? '✓ Balanced' : '✗ Unbalanced'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── P&L Statement ─── */}
      {view === 'pl' && pnlStatement && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16 }}>
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#34d399' }}>Revenue</div>
              {pnlStatement.revenue.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--bg-border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.accountName}</span>
                  <span style={{ fontWeight: 600, color: '#34d399' }}>₹{formatNumber(item.amount / 100)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Total Revenue</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#34d399' }}>₹{formatNumber(pnlStatement.totalRevenue / 100)}</span>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#f87171' }}>Expenses</div>
              {pnlStatement.expenses.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--bg-border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.accountName}</span>
                  <span style={{ fontWeight: 600, color: '#f87171' }}>₹{formatNumber(item.amount / 100)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Total Expenses</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#f87171' }}>₹{formatNumber(pnlStatement.totalExpenses / 100)}</span>
              </div>
            </div>

            <div className="card" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>NET PROFIT</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#34d399' }}>₹{formatNumber(pnlStatement.netProfit / 100)}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Net Margin: {pnlStatement.totalRevenue > 0 ? ((pnlStatement.netProfit / pnlStatement.totalRevenue) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Revenue vs Expenses</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Current Period Comparison</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { name: 'Revenue', val: pnlStatement.totalRevenue / 100, fill: '#6366f1' },
                  { name: 'Expenses', val: pnlStatement.totalExpenses / 100, fill: '#ef4444' },
                  { name: 'Net Profit', val: pnlStatement.netProfit / 100, fill: '#10b981' }
                ]} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: '#5a5a72', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#5a5a72', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatNumber(v)}`} />
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => [`₹${formatNumber(v)}`, '']} />
                  <Bar dataKey="val" name="Amount" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Revenue Breakdown</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie 
                    data={pnlStatement.revenue.map(item => ({ name: item.accountName, value: item.amount / 100 }))} 
                    dataKey="value" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={80} 
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => [`₹${formatNumber(v)}`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}