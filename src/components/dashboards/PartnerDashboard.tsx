'use client';
import React from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { mockPartners } from '@/lib/mockData';

const capitalGrowth = [
  { month: 'Oct', totalInvestment: 5000000, value: 5210000 },
  { month: 'Nov', totalInvestment: 5000000, value: 5440000 },
  { month: 'Dec', totalInvestment: 5000000, value: 5690000 },
  { month: 'Jan', totalInvestment: 5000000, value: 5920000 },
  { month: 'Feb', totalInvestment: 5000000, value: 6180000 },
  { month: 'Mar', totalInvestment: 5000000, value: 6450000 },
];

const dividendHistory = [
  { month: 'Oct', amount: 185000, ownership: 40.0 },
  { month: 'Nov', amount: 198000, ownership: 40.0 },
  { month: 'Dec', amount: 224000, ownership: 39.8 },
  { month: 'Jan', amount: 248000, ownership: 40.0 },
  { month: 'Feb', amount: 236000, ownership: 40.0 },
  { month: 'Mar', amount: 284000, ownership: 40.0 },
];

export default function PartnerDashboard() {
  const partner = mockPartners[0];

  return (
    <div className="fade-in-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Partner Portfolio</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Welcome back, {partner.name} · Partner ID: {partner.id}</p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Invested Capital', val: `₹${formatNumber(partner.totalInvestment)}`, color: '#6366f1', icon: '💼', sub: `Since ${partner.investedDate}` },
          { label: 'Current Ownership', val: `${partner.ownership.toFixed(2)}%`, color: '#10b981', icon: '📊', sub: 'Weighted average' },
          { label: 'Total Profit Earned', val: `₹${formatNumber(partner.profit)}`, color: '#f59e0b', icon: '💰', sub: 'Cumulative' },
          { label: 'Current Month Dividend', val: '₹2,84,000', color: '#8b5cf6', icon: '🎯', sub: 'March 2026' },
          { label: 'Portfolio Value', val: '₹64.5L', color: '#06b6d4', icon: '📈', sub: 'Capital + Returns' },
        ].map((item, i) => (
          <div key={i} className="card" style={{ flex: 1, textAlign: 'center', padding: 18 }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.val}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Capital Growth Curve</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Invested vs Portfolio Value (₹)</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={capitalGrowth}>
              <defs>
                <linearGradient id="gradVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#5a5a72', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a5a72', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatNumber(v)}`} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => [`₹${formatNumber(v)}`, '']} />
              <Area type="monotone" dataKey="totalInvestment" name="Capital" stroke="#6366f1" fill="rgba(99,102,241,0.15)" strokeWidth={2} />
              <Area type="monotone" dataKey="value" name="Portfolio Value" stroke="#f59e0b" fill="url(#gradVal)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Monthly Dividend History</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Based on weighted ownership % each month</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dividendHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#5a5a72', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a5a72', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatNumber(v)}`} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => [`₹${formatNumber(v)}`, 'Dividend']} />
              <Bar dataKey="amount" fill="#8b5cf6" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* All Partners */}
      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Partner Pool — Ownership Distribution</div>
        <table className="data-table">
          <thead><tr><th>Partner</th><th>Capital Invested</th><th>Investment Date</th><th>Ownership %</th><th>Profit Share</th><th>Status</th></tr></thead>
          <tbody>
            {mockPartners.map(p => (
              <tr key={p.id}>
                <td className="primary">{p.name}</td>
                <td>₹{formatNumber(p.totalInvestment)}</td>
                <td>{p.investedDate}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress-bar" style={{ width: 80 }}>
                      <div className="progress-fill" style={{ width: `${p.ownership}%`, background: 'var(--grad-primary)' }} />
                    </div>
                    <span style={{ fontWeight: 700, color: '#a5b4fc' }}>{p.ownership.toFixed(2)}%</span>
                  </div>
                </td>
                <td style={{ color: '#fbbf24', fontWeight: 600 }}>₹{formatNumber(p.profit)}</td>
                <td><span className="badge badge-success">{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
