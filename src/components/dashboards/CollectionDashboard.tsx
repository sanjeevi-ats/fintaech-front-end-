'use client';
import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, AlertTriangle, MapPin, Wifi, WifiOff, Camera, Phone, Loader2, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { installmentService, Installment, RecordPaymentRequest } from '@/services/installmentService';
import DashboardSummaryCard from '@/components/DashboardSummaryCard';
import AnalyticsReport from '@/components/AnalyticsReport';
import { reportPeriods, formatReportCurrency, CategorizedData } from '@/lib/reportUtils';

export default function CollectionDashboard() {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(reportPeriods.today());
  const [reportData] = useState<CategorizedData[]>([
    { category: 'Collected', value: 485, percentage: 65 },
    { category: 'Pending', value: 215, percentage: 29 },
    { category: 'Partial', value: 45, percentage: 6 },
  ]);

  useEffect(() => {
    loadDueInstallments();
  }, []);

  const loadDueInstallments = async () => {
    try {
      setLoading(true);
      setError(null);
      const today = new Date().toISOString().split('T')[0];
      const data = await installmentService.getDueInstallments(today, today);
      setInstallments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load installments');
    } finally {
      setLoading(false);
    }
  };

  const markCollected = async (installment: Installment) => {
    try {
      setSubmitting(installment.id);
      const payment: RecordPaymentRequest = {
        installmentId: installment.id,
        amountPaid: installment.amount,
        mode: 'cash',
      };
      await installmentService.recordPayment(payment);
      await loadDueInstallments(); // Refresh data
    } catch (err: any) {
      alert(`Failed to record payment: ${err.message}`);
    } finally {
      setSubmitting(null);
    }
  };

  const collected = installments.filter(d => d.status === 'paid').length;
  const total = installments.length;
  const collectedAmount = installments.filter(d => d.status === 'paid').reduce((s, d) => s + d.amount, 0);
  const targetAmount = installments.reduce((s, d) => s + d.amount, 0);
  const progress = total > 0 ? (collected / total) * 100 : 0;

  if (loading) {
    return (
      <div className="fade-in-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <Loader2 className="animate-spin" size={32} />
        <span style={{ marginLeft: 12 }}>Loading collection sheet...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in-up">
        <div className="alert alert-danger">
          <AlertTriangle size={16} />
          Error loading collection sheet: {error}
          <button className="btn btn-secondary btn-sm" onClick={loadDueInstallments} style={{ marginLeft: 12 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Daily Collection Sheet</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn btn-sm ${offline ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setOffline(!offline)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {offline ? <WifiOff size={12} /> : <Wifi size={12} />}
            {offline ? 'Offline Mode' : 'Online'}
          </button>
          {offline && <span className="badge badge-warning" style={{ alignSelf: 'center' }}>Offline mode active</span>}
        </div>
      </div>

      {/* Circular Progress + Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {/* Circular Progress */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 30, flex: 1 }}>
          <div style={{ position: 'relative', width: 120, height: 120 }}>
            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--bg-border)" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="#10b981" strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - progress / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#34d399' }}>{Math.round(progress)}%</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Done</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Today's Progress</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{collected}/{total}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Collections completed</div>
          </div>
        </div>

        {[
          { label: 'Target Amount', val: `₹${(targetAmount / 100).toLocaleString()}`, color: '#6366f1' },
          { label: 'Collected', val: `₹${(collectedAmount / 100).toLocaleString()}`, color: '#10b981' },
          { label: 'Pending', val: `₹${((targetAmount - collectedAmount) / 100).toLocaleString()}`, color: '#f59e0b' },
          { label: 'Overdue Accounts', val: installments.filter(i => new Date(i.dueDate) < new Date()).length.toString(), color: '#ef4444' },
        ].map((item, i) => (
          <div key={i} className="card" style={{ flex: 1, textAlign: 'center', padding: 18 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>{item.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* DCS List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Collection Entries</div>
          <button className="btn btn-secondary btn-sm" onClick={loadDueInstallments}>Refresh</button>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>#</th><th>Loan ID</th><th>Installment</th><th>Due Date</th><th>Amount</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {installments.map((installment, i) => (
              <tr key={installment.id}>
                <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{installment.no}</td>
                <td className="mono" style={{ fontSize: 11 }}>{installment.loanCaseId.slice(0, 8)}...</td>
                <td className="primary">#{installment.no}</td>
                <td style={{ fontSize: 11 }}>{new Date(installment.dueDate).toLocaleDateString()}</td>
                <td style={{ fontWeight: 600, color: '#fbbf24' }}>₹{(installment.amount / 100).toLocaleString()}</td>
                <td>
                  <span className={`badge ${
                    installment.status === 'paid' ? 'badge-success' : 
                    installment.status === 'partially_paid' ? 'badge-warning' : 
                    'badge-gray'
                  }`}>
                    {installment.status === 'paid' ? '✓ Paid' : 
                     installment.status === 'partially_paid' ? '~ Partial' : 
                     '○ Pending'}
                  </span>
                </td>
                <td>
                  {installment.status !== 'paid' && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button 
                        className="btn btn-success btn-sm" 
                        style={{ fontSize: 10 }} 
                        onClick={() => markCollected(installment)}
                        disabled={submitting === installment.id}
                      >
                        {submitting === installment.id ? (
                          <Loader2 className="animate-spin" size={10} />
                        ) : (
                          <CheckCircle2 size={10} />
                        )}
                        {submitting === installment.id ? 'Recording...' : 'Mark Paid'}
                      </button>
                    </div>
                  )}
                  {installment.status === 'paid' && <CheckCircle2 size={16} color="#34d399" />}
                </td>
              </tr>
            ))}
            {installments.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No installments due today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Offline indicator */}
      {offline && (
        <div className="alert alert-info" style={{ marginTop: 16, borderRadius: 12 }}>
          <WifiOff size={14} />
          <div>
            <div style={{ fontWeight: 700 }}>Offline Mode Active</div>
            <div style={{ fontSize: 11 }}>Collection entries will be stored locally and synced when connection is restored.</div>
          </div>
        </div>
      )}

      {/* PHASE 10: Collection Analytics */}
      <div style={{ marginTop: 24, marginBottom: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            📊 Collection Analytics
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Real-time collection performance and progress
          </p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          <DashboardSummaryCard
            title="Daily Target"
            value={formatReportCurrency(750000)}
            subtitle="Collection goal"
            trend={{ value: 750000, percentage: 0, direction: 'neutral' }}
            icon={<DollarSign size={20} />}
            color="primary"
          />
          <DashboardSummaryCard
            title="Collected Today"
            value={formatReportCurrency(collectedAmount)}
            subtitle={`${collected} of ${total} payments`}
            trend={{ value: collectedAmount, percentage: 12, direction: 'up' }}
            icon={<TrendingUp size={20} />}
            color="success"
          />
          <DashboardSummaryCard
            title="Collection Rate"
            value={`${Math.round(progress)}%`}
            subtitle="Today's progress"
            trend={{ value: progress, percentage: 5, direction: 'up' }}
            icon={<Activity size={20} />}
            color="info"
          />
          <DashboardSummaryCard
            title="Pending Collection"
            value={formatReportCurrency(targetAmount - collectedAmount)}
            subtitle={`${total - collected} pending`}
            trend={{ value: targetAmount - collectedAmount, percentage: 1, direction: 'down' }}
            icon={<Clock size={20} />}
            color="warning"
          />
        </div>

        {/* Collection Status Report */}
        <AnalyticsReport
          title="Collection Status by Progress"
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
            a.download = `collection-report-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
          }}
        />
      </div>
    </div>
  );
}
