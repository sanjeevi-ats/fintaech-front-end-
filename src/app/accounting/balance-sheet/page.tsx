'use client';
import React, { useState, useEffect } from 'react';
import { FileText, Loader2, AlertCircle, Download } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { reportService, BalanceSheetReport } from '@/services/reportService';

export default function BalanceSheetPage() {
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetReport | null>(null);
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchBalanceSheet = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await reportService.getBalanceSheet(fromDate, toDate);
      setBalanceSheet(result);
    } catch (err: any) {
      console.error('Fetch balance sheet error:', err);
      setError('Failed to load balance sheet. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExporting(true);
      const blob = await reportService.downloadBalanceSheetPdf(fromDate, toDate);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `balance-sheet-${fromDate}-${toDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchBalanceSheet();
  }, [fromDate, toDate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading balance sheet...</p>
      </div>
    );
  }

  if (!balanceSheet) {
    return (
      <div className="fade-in-up">
        <div className="alert alert-danger" style={{ marginBottom: 20, borderRadius: 12 }}>
          <AlertCircle size={16} />
          <span>Balance sheet data not available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={20} color="#6366f1" /> Balance Sheet
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Statement of financial position</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={fetchBalanceSheet}
            disabled={loading}
          >
            Refresh
          </button>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={handleExportPdf}
            disabled={exporting}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={14} />
            Export PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20, borderRadius: 12 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Date Range Selectors */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--bg-border)',
                borderRadius: 6,
                fontSize: 13,
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--bg-border)',
                borderRadius: 6,
                fontSize: 13,
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Balance Sheet Structure */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Assets Section */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: 16, borderBottom: '2px solid var(--bg-border)', background: 'rgba(99, 102, 241, 0.05)' }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#6366f1' }}>ASSETS</div>
          </div>
          {balanceSheet.assets.items.map((item, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '12px 16px',
              borderBottom: '1px solid var(--bg-border)',
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{item.code}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.name}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>₹{formatNumber(item.amount / 100)}</div>
            </div>
          ))}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '14px 16px',
            background: 'rgba(99, 102, 241, 0.1)',
            borderTop: '2px solid var(--bg-border)',
            fontWeight: 900,
            fontSize: 14,
          }}>
            <span>Total Assets</span>
            <span style={{ color: '#6366f1' }}>₹{formatNumber(balanceSheet.totalAssets / 100)}</span>
          </div>
        </div>

        {/* Liabilities & Equity Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Liabilities */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: 16, borderBottom: '2px solid var(--bg-border)', background: 'rgba(249, 158, 11, 0.05)' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#f59e0b' }}>LIABILITIES</div>
            </div>
            {balanceSheet.liabilities.items.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid var(--bg-border)',
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{item.code}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.name}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>₹{formatNumber(item.amount / 100)}</div>
              </div>
            ))}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'rgba(249, 158, 11, 0.1)',
              borderTop: '2px solid var(--bg-border)',
              fontWeight: 900,
              fontSize: 14,
            }}>
              <span>Total Liabilities</span>
              <span style={{ color: '#f59e0b' }}>₹{formatNumber(balanceSheet.liabilities.subtotal / 100)}</span>
            </div>
          </div>

          {/* Equity */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: 16, borderBottom: '2px solid var(--bg-border)', background: 'rgba(139, 92, 246, 0.05)' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#8b5cf6' }}>EQUITY</div>
            </div>
            {balanceSheet.equity.items.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid var(--bg-border)',
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{item.code}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.name}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>₹{formatNumber(item.amount / 100)}</div>
              </div>
            ))}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'rgba(139, 92, 246, 0.1)',
              borderTop: '2px solid var(--bg-border)',
              fontWeight: 900,
              fontSize: 14,
            }}>
              <span>Total Equity</span>
              <span style={{ color: '#8b5cf6' }}>₹{formatNumber(balanceSheet.equity.subtotal / 100)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Accounting Equation Verification */}
      <div className="card" style={{
        padding: 20,
        background: balanceSheet.isBalanced ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
        border: `2px solid ${balanceSheet.isBalanced ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
            ACCOUNTING EQUATION VERIFICATION
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>ASSETS</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#6366f1' }}>
                ₹{formatNumber(balanceSheet.totalAssets / 100)}
              </div>
            </div>
            <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>=</div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>LIABILITIES + EQUITY</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#f59e0b' }}>
                ₹{formatNumber(balanceSheet.totalLiabilitiesAndEquity / 100)}
              </div>
            </div>
          </div>
        </div>
        <div style={{
          textAlign: 'center',
          padding: '12px 20px',
          background: balanceSheet.isBalanced ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 900,
          color: balanceSheet.isBalanced ? '#34d399' : '#f87171',
        }}>
          {balanceSheet.isBalanced ? '✓ BALANCED (Assets = Liabilities + Equity)' : '✗ UNBALANCED'}
        </div>
      </div>
    </div>
  );
}

