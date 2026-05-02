'use client';
import React, { useState } from 'react';
import { FileText, Download, Calendar, Filter, Loader2, AlertCircle, CheckCircle2, BarChart3, TrendingUp, PieChart, Users } from 'lucide-react';
import { reportService } from '@/services/reportService';
import { useAuth } from '@/context/AuthContext';

interface ReportOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  requiresDateRange: boolean;
  requiresId?: boolean;
  idLabel?: string;
}

const reports: ReportOption[] = [
  {
    id: 'customer-loan',
    name: 'Customer Loan Report',
    description: 'Individual customer loan history and details',
    icon: <FileText size={24} />,
    color: '#6366f1',
    requiresDateRange: false,
    requiresId: true,
    idLabel: 'Customer ID'
  },
  {
    id: 'turnover',
    name: 'Company Turnover Report',
    description: 'Overall business performance metrics',
    icon: <TrendingUp size={24} />,
    color: '#10b981',
    requiresDateRange: true
  },
  {
    id: 'pnl',
    name: 'Profit & Loss Report',
    description: 'Financial performance statement',
    icon: <BarChart3 size={24} />,
    color: '#f59e0b',
    requiresDateRange: true
  },
  {
    id: 'partner',
    name: 'Partner Investment Report',
    description: 'Partner investment and profit details',
    icon: <Users size={24} />,
    color: '#8b5cf6',
    requiresDateRange: false,
    requiresId: true,
    idLabel: 'Partner ID'
  },
  {
    id: 'par',
    name: 'Portfolio at Risk Report',
    description: 'Risk assessment and overdue analysis',
    icon: <PieChart size={24} />,
    color: '#ef4444',
    requiresDateRange: true
  },
  {
    id: 'efficiency',
    name: 'Collection Efficiency Report',
    description: 'Collection performance tracking',
    icon: <BarChart3 size={24} />,
    color: '#06b6d4',
    requiresDateRange: true
  }
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerId, setCustomerId] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Role-based access control
  const hasReportAccess = user?.role === 'super_admin' || 
                         user?.role === 'branch_manager' || 
                         user?.role === 'accountant';

  const handleDownload = async () => {
    if (!selectedReport) {
      setError('Please select a report');
      return;
    }

    const report = reports.find(r => r.id === selectedReport);
    if (!report) return;

    if (report.requiresDateRange && (!startDate || !endDate)) {
      setError('Please select date range');
      return;
    }

    if (report.requiresId) {
      const idValue = report.id === 'customer-loan' ? customerId : partnerId;
      if (!idValue) {
        setError(`Please enter ${report.idLabel}`);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      switch (selectedReport) {
        case 'customer-loan':
          await reportService.downloadCustomerLoanReport(customerId);
          break;
        case 'turnover':
          await reportService.downloadTurnoverReport(startDate, endDate);
          break;
        case 'pnl':
          await reportService.downloadPnLReport(startDate, endDate);
          break;
        case 'partner':
          await reportService.downloadPartnerReport(partnerId);
          break;
        case 'par':
          await reportService.downloadParReport(startDate, endDate);
          break;
        case 'efficiency':
          await reportService.downloadCollectionEfficiencyReport(startDate, endDate);
          break;
      }

      setSuccess(`${report.name} downloaded successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  if (!hasReportAccess) {
    return (
      <div className="fade-in-up">
        <div className="alert alert-danger" style={{ borderRadius: 12 }}>
          <AlertCircle size={16} />
          <div>
            <div style={{ fontWeight: 700 }}>Access Denied</div>
            <div style={{ fontSize: 12 }}>Only Admins, Branch Managers, and Accountants can access reports.</div>
          </div>
        </div>
      </div>
    );
  }

  const selectedReportData = reports.find(r => r.id === selectedReport);

  return (
    <div className="fade-in-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={20} color="#6366f1" /> Reports & Analytics
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Download comprehensive reports for financial analysis and decision making</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Reports Grid */}
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Available Reports</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => {
                    setSelectedReport(report.id);
                    setError(null);
                  }}
                  style={{
                    padding: 16,
                    border: selectedReport === report.id ? `2px solid ${report.color}` : '1px solid var(--bg-border)',
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: selectedReport === report.id ? `${report.color}08` : 'var(--bg-elevated)',
                    transition: 'all 0.2s'
                  }}
                  className="hover-lift"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ color: report.color }}>
                      {report.icon}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: report.color }}>
                      {report.name}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {report.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Download Panel */}
        <div>
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Download Report</div>

            {selectedReportData ? (
              <>
                <div style={{ 
                  background: `${selectedReportData.color}08`, 
                  padding: 12, 
                  borderRadius: 8, 
                  marginBottom: 16,
                  border: `1px solid ${selectedReportData.color}20`
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: selectedReportData.color }}>
                    {selectedReportData.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {selectedReportData.description}
                  </div>
                </div>

                {/* Date Range Input */}
                {selectedReportData.requiresDateRange && (
                  <div style={{ marginBottom: 16 }}>
                    <div className="input-label">Date Range *</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>From</label>
                        <input
                          type="date"
                          className="input"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          style={{ fontSize: 12 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>To</label>
                        <input
                          type="date"
                          className="input"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          style={{ fontSize: 12 }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ID Input */}
                {selectedReportData.requiresId && (
                  <div style={{ marginBottom: 16 }}>
                    <div className="input-label">{selectedReportData.idLabel} *</div>
                    <input
                      type="text"
                      className="input"
                      placeholder={`Enter ${selectedReportData.idLabel}`}
                      value={selectedReport === 'customer-loan' ? customerId : partnerId}
                      onChange={(e) => {
                        if (selectedReport === 'customer-loan') {
                          setCustomerId(e.target.value);
                        } else {
                          setPartnerId(e.target.value);
                        }
                      }}
                      style={{ fontSize: 12 }}
                    />
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger" style={{ marginBottom: 12, fontSize: 11 }}>
                    <AlertCircle size={12} />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="alert alert-success" style={{ marginBottom: 12, fontSize: 11 }}>
                    <CheckCircle2 size={12} />
                    {success}
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={handleDownload}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      Download Report
                    </>
                  )}
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20, fontSize: 12 }}>
                Select a report from the list to download
              </div>
            )}
          </div>

          {/* Report Info */}
          <div style={{ 
            marginTop: 16, 
            padding: 12, 
            background: 'rgba(99,102,241,0.08)', 
            borderRadius: 8,
            fontSize: 11,
            color: 'var(--text-muted)'
          }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>📊 Report Info</div>
            <ul style={{ marginLeft: 16, marginTop: 4 }}>
              <li>Reports are generated in HTML format</li>
              <li>Print to PDF from your browser</li>
              <li>All data is current as of generation time</li>
              <li>Reports include financial calculations</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Report Descriptions */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Report Descriptions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {reports.map((report) => (
            <div key={report.id} className="card" style={{ padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ color: report.color, fontSize: 18 }}>
                  {report.icon}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>
                  {report.name}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {report.description}
              </div>
              {report.requiresDateRange && (
                <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 8 }}>
                  ⏰ Requires date range
                </div>
              )}
              {report.requiresId && (
                <div style={{ fontSize: 10, color: '#8b5cf6', marginTop: 8 }}>
                  🔍 Requires {report.idLabel}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
