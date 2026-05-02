'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ArrowDownCircle, Percent, Info, Loader2, AlertCircle } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { partnerService, Partner, PartnerCapitalSummary } from '@/services/partnerService';

export default function EquityPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [summaries, setSummaries] = useState<Record<string, PartnerCapitalSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfuse, setShowInfuse] = useState(false);
  const [showDrawdown, setShowDrawdown] = useState(false);
  const [form, setForm] = useState({ partnerId: '', amount: '' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const partnerList = await partnerService.getAll();
      setPartners(partnerList);
      
      const summaryPromises = partnerList.map(p => partnerService.getCapitalSummary(p.id));
      const summaryList = await Promise.all(summaryPromises);
      
      const summaryMap: Record<string, PartnerCapitalSummary> = {};
      summaryList.forEach(s => {
        summaryMap[s.partnerId] = s;
      });
      setSummaries(summaryMap);
      setError(null);
    } catch (err: any) {
      console.error('Fetch partners error:', err);
      setError('Failed to load partner data. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalCapital = Object.values(summaries).reduce((s, p) => s + p.currentBalance / 100, 0);

  const handleInfuse = async () => {
    if (!form.partnerId || !form.amount) return;
    try {
      setLoading(true);
      await partnerService.addInvestment({ 
        partnerId: form.partnerId, 
        amount: parseFloat(form.amount) * 100 
      });
      setShowInfuse(false);
      fetchData();
    } catch (err: any) {
      alert('Error infusing capital: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!form.partnerId || !form.amount) return;
    try {
      setLoading(true);
      await partnerService.recordWithdrawal({ 
        partnerId: form.partnerId, 
        amount: parseFloat(form.amount) * 100 
      });
      setShowDrawdown(false);
      fetchData();
    } catch (err: any) {
      alert('Error recording drawdown: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && partners.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading equity data...</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Equity Engine — Partner Management</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Pro-rata ownership calculation with time-weighted capital</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={fetchData}>Refresh</button>
          <button className="btn btn-secondary" onClick={() => setShowDrawdown(true)}><ArrowDownCircle size={13} /> Record Drawdown</button>
          <button className="btn btn-primary" onClick={() => setShowInfuse(true)}><Plus size={13} /> Capital Infusion</button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20, borderRadius: 12 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Equity summary */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total Capital Pool', val: `₹${formatNumber(totalCapital)}`, color: '#6366f1' },
          { label: 'Partners', val: partners.length, color: '#10b981' },
          { label: 'Total Profit Distributed', val: `₹${formatNumber(Object.values(summaries).reduce((s, p) => s + p.totalProfit / 100, 0))}`, color: '#f59e0b' },
          { label: 'System Date', val: new Date().toLocaleDateString(), color: '#8b5cf6' },
        ].map((item, i) => (
          <div key={i} className="card" style={{ flex: 1, padding: 18 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.val}</div>
          </div>
        ))}
      </div>

      <div className="alert alert-info" style={{ marginBottom: 16, borderRadius: 10 }}>
        <Info size={13} />
        <span style={{ fontSize: 12 }}>Ownership % is calculated based on current balance relative to the total pool. Real-time profit sharing is adjusted for weighted capital.</span>
      </div>

      {/* Partner Table */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Partner Ownership Breakdown</div>
        <table className="data-table">
          <thead>
            <tr><th>Partner Name</th><th>Total Investment</th><th>Current Balance</th><th>Ownership %</th><th>Status</th></tr>
          </thead>
          <tbody>
            {partners.map(p => {
              const summary = summaries[p.id];
              const ownership = totalCapital > 0 ? ((summary?.currentBalance / 100) / totalCapital) * 100 : 0;
              return (
                <tr key={p.id}>
                  <td className="primary">
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.email}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>₹{formatNumber((summary?.totalInvestment || 0) / 100)}</td>
                  <td style={{ fontWeight: 600, color: '#34d399' }}>₹{formatNumber((summary?.currentBalance || 0) / 100)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar" style={{ width: 100 }}>
                        <div className="progress-fill" style={{ width: `${ownership}%`, background: 'var(--grad-primary)' }} />
                      </div>
                      <span style={{ fontWeight: 800, color: '#a5b4fc', fontSize: 13 }}>{ownership.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td><span className={`badge ${p.isActive ? 'badge-success' : 'badge-gray'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Capital Infusion Modal */}
      {showInfuse && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: 440 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Record Capital Infusion</div>
            <div style={{ marginBottom: 12 }}>
              <div className="input-label">Partner</div>
              <select className="select" style={{ width: '100%' }} value={form.partnerId} onChange={e => setForm({ ...form, partnerId: e.target.value })}>
                <option value="">Select Partner</option>
                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div className="input-label">Amount (₹)</div>
              <input className="input" type="number" placeholder="e.g. 500000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowInfuse(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleInfuse} disabled={loading}>Confirm Infusion</button>
            </div>
          </div>
        </div>
      )}

      {/* Drawdown Modal */}
      {showDrawdown && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: 440 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Record Partner Drawdown</div>
            <div style={{ marginBottom: 12 }}>
              <div className="input-label">Partner</div>
              <select className="select" style={{ width: '100%' }} value={form.partnerId} onChange={e => setForm({ ...form, partnerId: e.target.value })}>
                <option value="">Select Partner</option>
                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div className="input-label">Amount (₹)</div>
              <input className="input" type="number" placeholder="e.g. 50000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowDrawdown(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleWithdraw} disabled={loading}>Confirm Drawdown</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
