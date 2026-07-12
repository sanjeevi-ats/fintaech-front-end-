'use client';
import React, { useState, useEffect } from 'react';
import { Scale, Loader2, AlertCircle, Download } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { reportService, TrialBalanceItem } from '@/services/reportService';

export default function TrialBalancePage() {
  const [items, setItems] = useState<TrialBalanceItem[]>([]);
  const [totalDebits, setTotalDebits] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [isBalanced, setIsBalanced] = useState(false);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchTrialBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await reportService.getTrialBalance(asOfDate);
      setItems(result.items);
      setTotalDebits(result.totalDebits);
      setTotalCredits(result.totalCredits);
      setIsBalanced(result.isBalanced);
    } catch (err: any) {
      console.error('Fetch trial balance error:', err);
      setError('Failed to load trial balance. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExporting(true);
      const blob = await reportService.downloadTrialBalancePdf(asOfDate);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trial-balance-${asOfDate}.pdf`;
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
    fetchTrialBalance();
  }, [asOfDate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading trial balance...</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Scale size={20} color="#6366f1" /> Trial Balance
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Verify total debits equal total credits</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={fetchTrialBalance}
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

      {/* Date Selector */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>
          As of Date
        </label>
        <input
          type="date"
          value={asOfDate}
          onChange={(e) => setAsOfDate(e.target.value)}
          style={{
            maxWidth: 200,
            padding: '8px 12px',
            border: '1px solid var(--bg-border)',
            borderRadius: 6,
            fontSize: 13,
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Trial Balance Table */}
      <div className="card" style={{ padding: 0, marginBottom: 20 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 16 }}>GL Account Code</th>
              <th>GL Account Name</th>
              <th>Debit Amount</th>
              <th>Credit Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="primary mono" style={{ paddingLeft: 16, fontWeight: 700, color: '#6366f1' }}>
                  {item.accountCode}
                </td>
                <td>{item.accountName}</td>
                <td style={{ fontWeight: 600, color: '#f87171' }}>
                  ₹{formatNumber(item.debitAmount / 100)}
                </td>
                <td style={{ fontWeight: 600, color: '#34d399' }}>
                  ₹{formatNumber(item.creditAmount / 100)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Row */}
      <div className="card" style={{ padding: 16, marginBottom: 20, background: 'var(--bg-elevated)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              Total Debits
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#f87171' }}>
              ₹{formatNumber(totalDebits / 100)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              Total Credits
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#34d399' }}>
              ₹{formatNumber(totalCredits / 100)}
            </div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: 12,
            background: isBalanced ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              Status
            </div>
            <div style={{
              fontSize: 18,
              fontWeight: 900,
              color: isBalanced ? '#34d399' : '#f87171',
            }}>
              {isBalanced ? '✓ BALANCED' : '✗ UNBALANCED'}
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card" style={{ padding: 16, background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <strong>Trial Balance Information:</strong><br />
          A trial balance is a list of all general ledger accounts (asset, liability, equity, revenue, and expense accounts) and their balances at a point in time. It verifies that the total debits equal total credits, ensuring the accuracy of the books.
        </div>
      </div>
    </div>
  );
}

