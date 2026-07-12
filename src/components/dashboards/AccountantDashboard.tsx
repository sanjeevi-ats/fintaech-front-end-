'use client';
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2, Clock, AlertTriangle, XCircle, DollarSign, TrendingUp, Activity, BarChart as BarChartIcon } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { mockJournalEntries, mockChartOfAccounts } from '@/lib/mockData';
import DashboardSummaryCard from '@/components/DashboardSummaryCard';
import AnalyticsReport from '@/components/AnalyticsReport';
import { reportPeriods, formatReportCurrency, CategorizedData } from '@/lib/reportUtils';

const trialBalanceData = [
  { account: 'Assets', debit: 91625000, credit: 0 },
  { account: 'Revenue', debit: 0, credit: 12400000 },
  { account: 'Equity', debit: 0, credit: 12500000 },
  { account: 'Expenses', debit: 8100000, credit: 0 },
  { account: 'Liabilities', debit: 0, credit: 0 },
];

const pendingExpenses = [
  { id: 'EXP-031', desc: 'Field Officer Allowance - March', amount: 28000, submittedBy: 'Ramesh CO', date: '2024-03-12' },
  { id: 'EXP-032', desc: 'Vehicle Fuel Reimbursement', amount: 8500, submittedBy: 'Suresh CO', date: '2024-03-12' },
  { id: 'EXP-034', desc: 'Stationery & Office Supplies', amount: 4200, submittedBy: 'Admin', date: '2024-03-13' },
];

export default function AccountantDashboard() {
  const systemCash = 285000;
  const physicalCash = 281500;
  const discrepancy = systemCash - physicalCash;
  const [selectedPeriod, setSelectedPeriod] = useState(reportPeriods.thisMonth());
  const [reportData] = useState<CategorizedData[]>([
    { category: 'Interest Income', value: 12400000, percentage: 55 },
    { category: 'Operating Expenses', value: 8100000, percentage: 36 },
    { category: 'Other Income', value: 1400000, percentage: 9 },
  ]);

  return (
    <div className="fade-in-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Accountant Control Panel</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Day-End Status · Trial Balance · Journal Entries</p>
      </div>

      {/* Reconciliation Alert */}
      {discrepancy !== 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 20, borderRadius: 12 }}>
          <AlertTriangle size={16} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>Day-End Reconciliation Pending</div>
            <div style={{ fontSize: 12 }}>System Cash: ₹{formatNumber(systemCash)} | Physical Cash: ₹{formatNumber(physicalCash)} | Discrepancy: ₹{Math.abs(discrepancy).toLocaleString()}</div>
            <div style={{ fontSize: 11, marginTop: 4, color: '#fbbf24' }}>⚠️ Branch Manager cannot log out until reconciled. Difference posted to Suspense Account.</div>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total Debit', val: '₹99.7L', color: '#6366f1', icon: '📤' },
          { label: 'Total Credit', val: '₹99.7L', color: '#10b981', icon: '📥' },
          { label: 'Interest Income (MTD)', val: '₹1.24Cr', color: '#f59e0b', icon: '💰' },
          { label: 'Pending Expenses', val: '₹40,700', color: '#ef4444', icon: '⏳' },
          { label: 'Recon. Status', val: 'OPEN', color: '#f59e0b', icon: '⚖️' },
        ].map((item, i) => (
          <div key={i} className="card" style={{ flex: 1, textAlign: 'center', padding: 18 }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Trial Balance */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Trial Balance — March 2026</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={trialBalanceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" tick={{ fill: '#5a5a72', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatNumber(v)}`} />
              <YAxis type="category" dataKey="account" tick={{ fill: '#9494aa', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => [`₹${formatNumber(v)}`, '']} />
              <Bar dataKey="debit" name="Debit" fill="#6366f1" radius={[0,4,4,0]} />
              <Bar dataKey="credit" name="Credit" fill="#10b981" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pending Expense Approvals */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Pending Expense Approvals</div>
            <span className="badge badge-warning">{pendingExpenses.length} pending</span>
          </div>
          {pendingExpenses.map(exp => (
            <div key={exp.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--bg-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{exp.desc}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>By: {exp.submittedBy} · {exp.date}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>₹{exp.amount.toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button className="btn btn-success btn-sm" style={{ fontSize: 11 }}>✓ Approve</button>
                <button className="btn btn-danger btn-sm" style={{ fontSize: 11 }}>✗ Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Journal Entries */}
      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Recent Journal Entries</div>
        <table className="data-table">
          <thead><tr><th>JE ID</th><th>Date</th><th>Description</th><th>Debit Account</th><th>Credit Account</th><th>Amount</th><th>Ref</th></tr></thead>
          <tbody>
            {mockJournalEntries.map(je => (
              <tr key={je.id}>
                <td className="primary mono">{je.id}</td>
                <td>{je.date}</td>
                <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{je.description}</td>
                <td style={{ color: '#f87171' }}>{je.debit}</td>
                <td style={{ color: '#34d399' }}>{je.credit}</td>
                <td style={{ color: '#fbbf24', fontWeight: 600 }}>₹{je.amount.toLocaleString()}</td>
                <td className="mono" style={{ fontSize: 11 }}>{je.ref}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PHASE 10: Financial Analytics */}
      <div style={{ marginTop: 24, marginBottom: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            📊 Financial Analytics
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Real-time financial performance and metrics
          </p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          <DashboardSummaryCard
            title="Total Revenue"
            value={formatReportCurrency(12400000)}
            subtitle="Interest + Other income"
            trend={{ value: 12400000, percentage: 8, direction: 'up' }}
            icon={<DollarSign size={20} />}
            color="primary"
          />
          <DashboardSummaryCard
            title="Operating Expenses"
            value={formatReportCurrency(8100000)}
            subtitle="March running costs"
            trend={{ value: 8100000, percentage: 2, direction: 'up' }}
            icon={<Activity size={20} />}
            color="warning"
          />
          <DashboardSummaryCard
            title="Net Profit"
            value={formatReportCurrency(4300000)}
            subtitle="Revenue - Expenses"
            trend={{ value: 4300000, percentage: 15, direction: 'up' }}
            icon={<TrendingUp size={20} />}
            color="success"
          />
          <DashboardSummaryCard
            title="Profit Margin"
            value="34.7%"
            subtitle="Net profit / Revenue"
            trend={{ value: 34.7, percentage: 6, direction: 'up' }}
            icon={<BarChartIcon size={20} />}
            color="info"
          />
        </div>

        {/* Financial Distribution Report */}
        <AnalyticsReport
          title="Income & Expense Distribution"
          data={reportData}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          onExport={(data) => {
            const csv = [
              ['Category', 'Value', 'Percentage'],
              ...data.map(d => [d.category, d.value, d.percentage])
            ].map(row => row.join(',')).join('\n');
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
          }}
        />
      </div>
    </div>
  );
}
