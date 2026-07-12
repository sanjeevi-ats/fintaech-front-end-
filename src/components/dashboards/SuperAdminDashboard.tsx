'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Users, AlertTriangle,
  CheckCircle2, Building2, ArrowUpRight, Activity, Zap, Loader2,
  TrendingUp as TrendUp, DollarSign as Dollar, Users as UserIcon, Clock
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { mockStats as initialMockStats, mockMonthlyPL, mockBranchPerformance } from '@/lib/mockData';
import { reportService } from '@/services/reportService';
import DashboardSummaryCard from '@/components/DashboardSummaryCard';
import AnalyticsReport from '@/components/AnalyticsReport';
import { 
  getStatusDistribution, 
  reportPeriods,
  ReportPeriod,
  CategorizedData,
  formatReportCurrency
} from '@/lib/reportUtils';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

const parData = [
  { name: 'Current', value: 2510, color: '#10b981' },
  { name: 'PAR 0-15', value: 180, color: '#f59e0b' },
  { name: 'PAR 16-30', value: 120, color: '#f97316' },
  { name: 'PAR 31-60', value: 85, color: '#ef4444' },
  { name: 'NPA 60+', value: 92, color: '#dc2626' },
];

const weeklyCollection = [
  { day: 'Mon', target: 1200000, actual: 1150000 },
  { day: 'Tue', target: 1350000, actual: 1420000 },
  { day: 'Wed', target: 1100000, actual: 980000 },
  { day: 'Thu', target: 1450000, actual: 1480000 },
  { day: 'Fri', target: 1800000, actual: 1720000 },
  { day: 'Sat', target: 900000, actual: 870000 },
  { day: 'Today', target: 1600000, actual: 1240000 },
];

interface DashboardStats {
  aum: number;
  totalLoans: number;
  activeLoans: number;
  par30: number;
  collectionEfficiency: number;
  netProfit: number;
  disbursedToday: number;
  collectedToday: number;
}

function StatCard({ title, value, sub, icon: Icon, color, trend, trendVal }: any) {
  return (
    <div className={`metric-card stat-glow-${color}`} style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{title}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: color === 'purple' ? 'rgba(99,102,241,0.15)' :
            color === 'green' ? 'rgba(16,185,129,0.15)' :
            color === 'amber' ? 'rgba(245,158,11,0.15)' :
            color === 'cyan' ? 'rgba(6,182,212,0.15)' : 'rgba(239,68,68,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={20} color={
            color === 'purple' ? '#a5b4fc' : color === 'green' ? '#34d399' :
            color === 'amber' ? '#fbbf24' : color === 'cyan' ? '#22d3ee' : '#f87171'
          } />
        </div>
      </div>
      {trendVal !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {trend === 'up' ? <TrendingUp size={12} color="#34d399" /> : <TrendingDown size={12} color="#f87171" />}
          <span style={{ fontSize: 11, color: trend === 'up' ? '#34d399' : '#f87171', fontWeight: 600 }}>{trendVal}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>vs last month</span>
        </div>
      )}
    </div>
  );
}

const customTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="tooltip-content">
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{p.name}:</span>
            <span style={{ fontWeight: 600, fontSize: 11 }}>₹{formatNumber(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(initialMockStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>(reportPeriods.thisMonth());
  const [reportData, setReportData] = useState<CategorizedData[]>([
    { category: 'Excellent', value: 2480, percentage: 62 },
    { category: 'Good', value: 890, percentage: 22 },
    { category: 'Fair', value: 380, percentage: 9 },
    { category: 'Poor', value: 190, percentage: 5 },
  ]);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reportService.getDashboardStats();
      setStats({
        aum: data.totalDisbursed || 0,
        totalLoans: data.totalLoans || 0,
        activeLoans: data.activeLoans || 0,
        par30: data.portfolioAtRisk || 0,
        collectionEfficiency: data.collectionEfficiency || 0,
        netProfit: 0, // Not available in backend response
        disbursedToday: 0, // Not available in backend response
        collectedToday: data.totalCollected || 0,
      });
      setError(null);
    } catch (err: any) {
      console.error('Stats fetch error:', err);
      setError('Could not connect to API. Using cached/mock data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const handleExportReport = (data: CategorizedData[]) => {
    const csv = [
      ['Category', 'Value', 'Percentage'],
      ...data.map(d => [d.category, d.value, d.percentage])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="fade-in-up">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              Executive Dashboard
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              📅 {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · All Branches · {loading ? 'Updating...' : 'Live Snapshot'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {error && (
              <div className="alert alert-warning" style={{ padding: '6px 12px', borderRadius: 8 }}>
                <AlertTriangle size={12} />
                <span style={{ fontSize: 11, fontWeight: 600 }}>{error}</span>
              </div>
            )}
            <div className={`alert ${loading ? 'alert-warning' : 'alert-success'}`} style={{ padding: '6px 12px', borderRadius: 8 }}>
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />}
              <span style={{ fontSize: 11, fontWeight: 600 }}>{loading ? 'Refreshing...' : 'System Live'}</span>
            </div>
            <button className="btn btn-primary" onClick={fetchDashboardStats} disabled={loading} style={{ padding: '6px 12px', height: 'auto', fontSize: 11 }}>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row 1 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <StatCard title="Total AUM" value={`₹${formatNumber(stats.aum)}`} sub="Assets Under Management" icon={DollarSign} color="purple" trend="up" trendVal="+12.4%" />
        <StatCard title="Active Loans" value={stats.activeLoans.toLocaleString()} sub={`${stats.totalLoans.toLocaleString()} total portfolio`} icon={CheckCircle2} color="green" trend="up" trendVal="+87 this month" />
        <StatCard title="PAR 30 %" value={`${stats.par30}%`} sub="Portfolio at Risk (0-30 days)" icon={AlertTriangle} color="amber" trend="down" trendVal="-0.3%" />
        <StatCard title="Collection Eff." value={`${stats.collectionEfficiency}%`} sub="Today's collection rate" icon={Zap} color="cyan" trend="up" trendVal="+2.1%" />
        <StatCard title="Net Profit (MTD)" value={`₹${formatNumber(stats.netProfit)}`} sub="Current Month" icon={TrendingUp} color="purple" trend="up" trendVal="+18.6%" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 380px', gap: 16, marginBottom: 20 }}>
        {/* P&L Trend */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>P&L Trend</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Interest Income vs Operating Expenses</div>
            </div>
            <span className="badge badge-success">+18.6% MoM</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mockMonthlyPL}>
              <defs>
                <linearGradient id="gradInterest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#5a5a72', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a5a72', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatNumber(v)}`} />
              <Tooltip content={customTooltip} />
              <Area type="monotone" dataKey="interest" name="Interest Income" stroke="#6366f1" fill="url(#gradInterest)" strokeWidth={2} />
              <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" fill="url(#gradProfit)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Collection */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Weekly Collection</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Target vs Actual (₹ Lakhs)</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyCollection} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: '#5a5a72', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a5a72', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/100000).toFixed(0)}L`} />
              <Tooltip content={customTooltip} />
              <Bar dataKey="target" name="Target" fill="rgba(99,102,241,0.25)" radius={[4,4,0,0]} />
              <Bar dataKey="actual" name="Actual" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PAR Distribution */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Portfolio Quality</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>PAR Distribution — {stats.activeLoans} active loans</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={parData} cx="50%" cy="50%" innerRadius={44} outerRadius={70} dataKey="value" paddingAngle={3}>
                {parData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} loans`, '']} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 8, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
            {parData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{d.name}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Branch Performance Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Branch Performance Heatmap</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Comparative AUM, PAR%, and Collection Efficiency</div>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>AUM</th>
                <th>Loans</th>
                <th>PAR %</th>
                <th>Collection</th>
                <th>Health</th>
              </tr>
            </thead>
            <tbody>
              {mockBranchPerformance.map((b, i) => {
                const health = b.par < 3 && b.collection > 93 ? 'healthy' : b.par < 5 ? 'moderate' : 'risk';
                return (
                  <tr key={i}>
                    <td className="primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Building2 size={12} color="var(--text-muted)" />
                      {b.branch}
                    </td>
                    <td>₹{formatNumber(b.aum)}</td>
                    <td>{b.loans.toLocaleString()}</td>
                    <td>
                      <span style={{ color: b.par < 3 ? '#34d399' : b.par < 5 ? '#fbbf24' : '#f87171', fontWeight: 600 }}>
                        {b.par}%
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ width: 80 }}>
                          <div className="progress-fill" style={{
                            width: `${b.collection}%`,
                            background: b.collection > 93 ? 'var(--grad-success)' : 'var(--grad-warning)'
                          }} />
                        </div>
                        <span style={{ fontSize: 11 }}>{b.collection}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${health === 'healthy' ? 'badge-success' : health === 'moderate' ? 'badge-warning' : 'badge-danger'}`}>
                        {health === 'healthy' ? '✓ Healthy' : health === 'moderate' ? '⚠ Moderate' : '✗ At Risk'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Today's Summary */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Today's Activity</div>
          {[
            { label: 'Disbursed', val: `₹${formatNumber(stats.disbursedToday)}`, color: '#6366f1', icon: '🚀' },
            { label: 'Collected', val: `₹${formatNumber(stats.collectedToday)}`, color: '#10b981', icon: '💰' },
            { label: 'New Applications', val: '12', color: '#06b6d4', icon: '📋' },
            { label: 'Approved Loans', val: '8', color: '#8b5cf6', icon: '✅' },
            { label: 'Overdue Flagged', val: '5', color: '#f59e0b', icon: '⚠️' },
            { label: 'Legal Escalated', val: '2', color: '#ef4444', icon: '⚖️' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 5 ? '1px solid var(--bg-border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* PHASE 9: Analytics & Reports Section */}
      <div style={{ marginTop: 24, marginBottom: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            📊 Analytics & Reports
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Real-time performance metrics and portfolio insights
          </p>
        </div>

        {/* Summary Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          <DashboardSummaryCard
            title="Total Portfolio Value"
            value={formatReportCurrency(stats.aum)}
            subtitle={`${stats.activeLoans.toLocaleString()} active loans`}
            trend={{ value: stats.aum, percentage: 12, direction: 'up' }}
            icon={<Dollar size={20} />}
            color="primary"
          />
          <DashboardSummaryCard
            title="Collection Rate"
            value={`${stats.collectionEfficiency}%`}
            subtitle="Target efficiency"
            trend={{ value: stats.collectionEfficiency, percentage: 2, direction: 'up' }}
            icon={<TrendUp size={20} />}
            color="success"
          />
          <DashboardSummaryCard
            title="Portfolio at Risk"
            value={`${stats.par30}%`}
            subtitle="0-30 days overdue"
            trend={{ value: stats.par30, percentage: 0, direction: 'neutral' }}
            icon={<AlertTriangle size={20} />}
            color="warning"
          />
          <DashboardSummaryCard
            title="Active Branches"
            value={mockBranchPerformance.length.toString()}
            subtitle={`${mockBranchPerformance.filter(b => b.collection > 93).length} performing well`}
            trend={{ value: mockBranchPerformance.length, percentage: 100, direction: 'up' }}
            icon={<Building2 size={20} />}
            color="info"
          />
        </div>

        {/* Analytics Report */}
        <AnalyticsReport
          title="Portfolio Quality Distribution"
          data={reportData}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          onExport={handleExportReport}
        />
      </div>
    </div>
  );
}
