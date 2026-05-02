'use mystery';
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRightLeft, Plus, Filter, Info, Loader2, AlertCircle } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { accountingService, JournalEntry, TrialBalanceItem } from '@/services/accountingService';

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'journal' | 'coa'>('journal');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try multiple endpoints for journal entries
      let journalData: JournalEntry[] = [];
      try {
        journalData = await accountingService.getJournalEntries();
      } catch (journalErr) {
        console.warn('Main journal endpoint failed, trying alternatives:', journalErr);
        try {
          journalData = await accountingService.getJournalEntriesAlt();
        } catch (altErr) {
          console.warn('Alternative journal endpoint also failed:', altErr);
          journalData = []; // Continue with empty data
        }
      }

      // Try multiple endpoints for trial balance
      let tbData: TrialBalanceItem[] = [];
      try {
        tbData = await accountingService.getTrialBalance();
      } catch (tbErr1) {
        console.warn('Main trial balance endpoint failed, trying alternatives:', tbErr1);
        try {
          tbData = await accountingService.getTrialBalanceAlt();
        } catch (tbErr2) {
          console.warn('Alternative trial balance endpoint failed, trying ledger endpoint:', tbErr2);
          try {
            tbData = await accountingService.getLedgerAlt();
          } catch (tbErr3) {
            console.warn('All trial balance endpoints failed:', tbErr3);
            tbData = []; // Continue with empty data
          }
        }
      }

      setEntries(journalData);
      setTrialBalance(tbData);
      
      // If no data found, show informative message instead of error
      if (journalData.length === 0 && tbData.length === 0) {
        setError('No accounting data found. This could be because:\n• No transactions have been recorded yet\n• The accounting module is not set up\n• Backend endpoints are not implemented');
      }
      
    } catch (err: any) {
      console.error('Fetch journal error:', err);
      if (err.message.includes('Redis')) {
        setError('Redis connection error detected. Please ensure Redis server is running or update backend connection string with abortConnect=false.');
      } else if (err.message.includes('404')) {
        setError('Accounting endpoints not found. Please ensure the backend has the following endpoints implemented:\n• /api/v1/Journal/entries\n• /api/v1/Ledger/trial-balance');
      } else {
        setError('Failed to load ledger data. Ensure the backend is running on port 5177.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && entries.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Fetching ledger data...</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <ArrowRightLeft size={20} color="#6366f1" /> Double-Entry Ledger
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Every transaction creates a balanced Debit/Credit entry</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData}>Refresh</button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20, borderRadius: 12 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-elevated)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {[{ key: 'journal', label: 'Journal Entries' }, { key: 'coa', label: 'Chart of Accounts' }].map(tab => (
          <button
            key={tab.key}
            className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 8 }}
            onClick={() => setActiveTab(tab.key as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'journal' && (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 16 }}>JE ID</th>
                <th>Date</th>
                <th>Description</th>
                <th>Transactions</th>
                <th>Amount</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(je => (
                <tr key={je.id}>
                  <td className="primary mono" style={{ paddingLeft: 16 }}>{je.id.slice(0, 8)}</td>
                  <td>{new Date(je.date).toLocaleDateString()}</td>
                  <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{je.description}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, marginBottom: 2 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171' }} />
                      <span style={{ color: '#f87171' }}>{je.debitAccount}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                      <span style={{ color: '#34d399' }}>{je.creditAccount}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: '#fbbf24' }}>₹{formatNumber(je.amount / 100)}</td>
                  <td className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{je.reference || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'coa' && (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 16 }}>Account Name</th>
                <th>Total Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {trialBalance.map((acc, idx) => (
                <tr key={idx}>
                  <td className="primary" style={{ paddingLeft: 16 }}>{acc.accountName}</td>
                  <td style={{ fontWeight: 700, color: acc.creditBalance > 0 ? '#f87171' : '#34d399' }}>
                    ₹{formatNumber((acc.debitBalance || acc.creditBalance) / 100)} {acc.creditBalance > 0 ? '(Cr)' : '(Dr)'}
                  </td>
                  <td><span className="badge badge-success">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
