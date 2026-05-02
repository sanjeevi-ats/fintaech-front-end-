'use client';
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { mockLoans, mockDCS } from '@/lib/mockData';

const weeklyTrend = [
  { day: 'Mon', disbursed: 820000, collected: 760000 },
  { day: 'Tue', disbursed: 1200000, collected: 1150000 },
  { day: 'Wed', disbursed: 650000, collected: 590000 },
  { day: 'Thu', disbursed: 980000, collected: 920000 },
  { day: 'Fri', disbursed: 1400000, collected: 1350000 },
  { day: 'Sat', disbursed: 400000, collected: 380000 },
  { day: 'Today', disbursed: 560000, collected: 428000 },
];

export default function BranchManagerDashboard() {
  const overdueLoans = mockLoans.filter(l => l.dpd > 0);
  const activeLoans = mockLoans.filter(l => l.status === 'active');

  return (
    <div className="fade-in-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Branch Dashboard</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Mumbai - Andheri Branch · Friday, 13 March 2026</p>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Branch AUM', val: '₹22Cr', color: '#6366f1', icon: '🏦' },
          { label: 'Active Loans', val: activeLoans.length.toString(), color: '#10b981', icon: '✅' },
          { label: 'Overdue Cases', val: overdueLoans.length.toString(), color: '#f59e0b', icon: '⚠️' },
          { label: 'Today Disbursed', val: '₹5.6L', color: '#06b6d4', icon: '💸' },
          { label: 'Day-End Status', val: 'PENDING', color: '#ef4444', icon: '⏰' },
        ].map((item, i) => (
          <div key={i} className="card" style={{ flex: 1, textAlign: 'center', padding: 18 }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Branch Weekly Activity</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Disbursement vs Collection (₹)</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyTrend}>
              <defs>
                <linearGradient id="gDisb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gColl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: '#5a5a72', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a5a72', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatNumber(v)}`} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => [`₹${formatNumber(v)}`, '']} />
              <Area type="monotone" dataKey="disbursed" name="Disbursed" stroke="#6366f1" fill="url(#gDisb)" strokeWidth={2} />
              <Area type="monotone" dataKey="collected" name="Collected" stroke="#10b981" fill="url(#gColl)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Day-End Reconciliation */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Day-End Reconciliation</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Hard-stop until balanced</div>
          {[
            { label: 'Opening Balance', val: '₹3,20,000', color: 'var(--text-primary)' },
            { label: 'Cash Disbursed', val: '-₹5,60,000', color: '#f87171' },
            { label: 'Cash Collected', val: '+₹4,28,000', color: '#34d399' },
            { label: 'System Cash (Expected)', val: '₹1,88,000', color: '#a5b4fc', bold: true },
            { label: 'Physical Cash (Entered)', val: '₹1,84,500', color: '#fbbf24', bold: true },
            { label: 'Discrepancy', val: '-₹3,500', color: '#f87171', bold: true },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 5 ? '1px solid var(--bg-border)' : 'none' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</span>
              <span style={{ fontSize: 12, fontWeight: item.bold ? 700 : 500, color: item.color }}>{item.val}</span>
            </div>
          ))}
          <div className="alert alert-danger" style={{ marginTop: 14, borderRadius: 10 }}>
            <AlertTriangle size={13} />
            <div style={{ fontSize: 11 }}>Discrepancy of ₹3,500 detected. Please reconcile before logout. Amount will be posted to Suspense Account.</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input className="input" placeholder="Physical cash count..." style={{ fontSize: 12 }} />
            <button className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>Submit</button>
          </div>
        </div>
      </div>

      {/* Overdue Escalation */}
      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Overdue Escalation Tracker</div>
        <table className="data-table">
          <thead><tr><th>Loan ID</th><th>Customer</th><th>DPD</th><th>Outstanding</th><th>Escalation Stage</th><th>Action</th></tr></thead>
          <tbody>
            {mockLoans.filter(l => l.dpd > 0).map(loan => (
              <tr key={loan.id}>
                <td className="primary mono">{loan.id}</td>
                <td>{loan.customer}</td>
                <td style={{ color: loan.dpd > 30 ? '#f87171' : loan.dpd > 15 ? '#fbbf24' : '#fbbf24', fontWeight: 700 }}>{loan.dpd} days</td>
                <td>₹{loan.outstanding.toLocaleString()}</td>
                <td>
                  {loan.dpd <= 15 && <span className="badge badge-warning">📱 SMS/WhatsApp Alert</span>}
                  {loan.dpd > 15 && loan.dpd <= 30 && <span className="badge badge-danger">👤 Recovery Specialist</span>}
                  {loan.dpd > 30 && <span className="badge badge-danger">⚖️ Legal Module</span>}
                </td>
                <td>
                  <button className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
