'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatNumber } from '@/lib/utils';
import { partnerService } from '@/services/partnerService';
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react';

interface CapitalAccountModel {
  id: string;
  capitalAccountCode: string;
  partnerId: string;
  currentBalance: number; // in paise
  ownershipPercentage: number;
  partner?: {
    partnerCode?: string;
    name: string;
    email: string;
  };
}

export default function ProfitPage() {
  const [accounts, setAccounts] = useState<CapitalAccountModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distributeLoading, setDistributeLoading] = useState(false);
  const [profitInput, setProfitInput] = useState('30000');
  const [periodInput, setPeriodInput] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const list = await partnerService.getAllCapitalAccounts();
      setAccounts(list);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching capital accounts:', err);
      setError('Failed to load capital accounts. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalCapitalPaise = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  const totalCapitalRupees = totalCapitalPaise / 100;
  const targetProfitAmount = parseFloat(profitInput) || 0;

  // Compute live distribution based on user input
  const distributionData = accounts.map(acc => {
    const pct = totalCapitalPaise > 0 ? (acc.currentBalance / totalCapitalPaise) : 0;
    const computedShare = targetProfitAmount * pct;
    return {
      id: acc.id,
      code: acc.partner?.partnerCode || acc.capitalAccountCode || 'N/A',
      name: acc.partner?.name || 'Unknown',
      capital: acc.currentBalance / 100,
      ownership: pct * 100,
      share: Math.round(computedShare),
    };
  });

  const handleDistribute = async () => {
    if (targetProfitAmount <= 0) {
      alert('Please enter a valid profit amount greater than zero.');
      return;
    }
    if (!periodInput.trim()) {
      alert('Please enter a valid period (e.g., YYYY-MM).');
      return;
    }

    try {
      setDistributeLoading(true);
      await partnerService.distributeProfit({
        profitAmount: targetProfitAmount * 100, // to paise
        period: periodInput,
      });
      alert(`Success! Distributed ₹${formatNumber(targetProfitAmount)} to all partners. Journal entries posted automatically.`);
      fetchData();
    } catch (err: any) {
      alert('Error distributing profit: ' + (err.response?.data?.message || err.message));
    } finally {
      setDistributeLoading(false);
    }
  };

  if (loading && accounts.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading profit engine...</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Profit Distribution Engine</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Distribute net profit to partners pro-rata based on their current capital share.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20, borderRadius: 12 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Inputs and Calculations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        
        {/* Distribution Control Panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Distribution Controller</div>
            
            <div style={{ marginBottom: 12 }}>
              <div className="input-label">Company Profit to Distribute (₹)</div>
              <input 
                className="input" 
                type="number" 
                value={profitInput} 
                onChange={e => setProfitInput(e.target.value)} 
                placeholder="e.g. 30000"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className="input-label">Distribution Period (e.g., YYYY-MM)</div>
              <input 
                className="input" 
                type="text" 
                value={periodInput} 
                onChange={e => setPeriodInput(e.target.value)} 
                placeholder="e.g. 2026-03"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 12px', background: 'rgba(99,102,241,0.1)', borderRadius: 10, marginTop: 12, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Capital Pool</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#6366f1' }}>₹{formatNumber(totalCapitalRupees)}</div>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleDistribute} 
              disabled={distributeLoading || targetProfitAmount <= 0}
              style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {distributeLoading && <Loader2 size={13} className="animate-spin" />}
              💸 Distribute Profit Now
            </button>
          </div>
        </div>

        {/* Visual Chart of Pro-rata Shares */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Simulated Share Distribution</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Proportional division of ₹{formatNumber(targetProfitAmount)}</div>
          
          {distributionData.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No active partner accounts found to distribute to.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={distributionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" tick={{ fill: '#5a5a72', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatNumber(v)}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9494aa', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => [`₹${formatNumber(v)}`, 'Profit Share']} />
                <Bar dataKey="share" radius={[0, 6, 6, 0]}>
                  {distributionData.map((_, i) => <Cell key={i} fill={['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#ec4899'][i % 5]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Distribution Table */}
      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Partner Profit Share Details</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Partner Code</th>
              <th>Partner Name</th>
              <th>Capital Balance</th>
              <th>Ownership %</th>
              <th>Calculated Profit Share</th>
            </tr>
          </thead>
          <tbody>
            {distributionData.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                  No active partners available.
                </td>
              </tr>
            ) : (
              distributionData.map((p, i) => (
                <tr key={p.id}>
                  <td className="primary mono" style={{ fontWeight: 700, color: '#ec4899', fontSize: 12 }}>{p.code}</td>
                  <td className="primary">{p.name}</td>
                  <td style={{ fontWeight: 600 }}>₹{formatNumber(p.capital)}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#a5b4fc' }}>{p.ownership.toFixed(4)}%</span>
                  </td>
                  <td style={{ fontWeight: 800, color: '#fbbf24', fontSize: 15 }}>
                    ₹{formatNumber(p.share)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {distributionData.length > 0 && (
          <div style={{ marginTop: 14, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Total Profit Distributed</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>
              ₹{formatNumber(distributionData.reduce((s, p) => s + p.share, 0))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
