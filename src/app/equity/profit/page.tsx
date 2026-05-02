'use client';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatNumber } from '@/lib/utils';
import { mockPartners } from '@/lib/mockData';

const monthlyProfit = 7100000; // Mar 2026

const distribution = mockPartners.map(p => ({
  ...p,
  share: Math.round(monthlyProfit * p.ownership / 100),
}));

export default function ProfitPage() {
  return (
    <div className="fade-in-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Profit Distribution Engine</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Net Profit = Σ(Interest Collected) − Σ(Operating Expenses) · March 2026
        </p>
      </div>

      {/* Profit Calculation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Net Profit Calculation</div>
          {[
            { label: 'Gross Interest Collected', val: '₹1,24,00,000', color: '#34d399', sign: '+' },
            { label: 'Processing Fees', val: '₹3,20,000', color: '#34d399', sign: '+' },
            { label: 'Operating Expenses', val: '₹53,00,000', color: '#f87171', sign: '−' },
            { label: 'Provision for Bad Debt', val: '₹3,20,000', color: '#f87171', sign: '−' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--bg-border)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ width: 20, height: 20, borderRadius: 4, background: item.color === '#34d399' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: item.color }}>{item.sign}</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
              </div>
              <span style={{ fontWeight: 700, color: item.color }}>{item.val}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 12px', background: 'rgba(99,102,241,0.1)', borderRadius: 10, marginTop: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>= Net Distributable Profit</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#6366f1' }}>₹{formatNumber(monthlyProfit)}</span>
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Partner Share Distribution</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Based on time-weighted ownership % (March 2026)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={distribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" tick={{ fill: '#5a5a72', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatNumber(v)}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9494aa', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => [`₹${formatNumber(v)}`, 'Share']} />
              <Bar dataKey="share" radius={[0, 6, 6, 0]}>
                {distribution.map((_, i) => <Cell key={i} fill={['#6366f1', '#8b5cf6', '#06b6d4', '#10b981'][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Partner Distribution Detail</div>
          <button className="btn btn-primary btn-sm"
            onClick={() => alert('Profit distributed to all partner ledgers! Journal entries created automatically.')}>
            💸 Distribute Profit Now
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Partner</th>
              <th>Capital</th>
              <th>Ownership %</th>
              <th>Time Weight</th>
              <th>Profit Share (Mar)</th>
              <th>Cumulative Total</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {distribution.map((p, i) => (
              <tr key={p.id}>
                <td className="primary">{p.name}</td>
                <td>₹{formatNumber(p.totalInvestment)}</td>
                <td>
                  <span style={{ fontWeight: 700, color: '#a5b4fc' }}>{p.ownership.toFixed(4)}%</span>
                </td>
                <td style={{ color: '#22d3ee', fontWeight: 600 }}>
                  {(Math.min((new Date('2024-03-13').getTime() - new Date(p.investedDate).getTime()) / (86400000 * 31), 1) * 100).toFixed(2)}%
                </td>
                <td style={{ fontWeight: 800, color: '#fbbf24', fontSize: 15 }}>
                  ₹{p.share.toLocaleString()}
                </td>
                <td style={{ color: '#34d399', fontWeight: 600 }}>
                  ₹{formatNumber(p.profit + p.share)}
                </td>
                <td>
                  <button className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}>Transfer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 14, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 10, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Total Distributed</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>
            ₹{distribution.reduce((s, p) => s + p.share, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
