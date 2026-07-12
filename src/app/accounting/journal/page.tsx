'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRightLeft, Loader2, AlertCircle, ChevronUp, ChevronDown, X, FileText } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { accountingService, JournalEntry, TrialBalanceItem, JournalEntryDetail } from '@/services/accountingService';
import CodeSearchBar from '@/components/CodeSearchBar';

type SortField = 'date' | 'amount' | 'code';
type SortOrder = 'asc' | 'desc';
type TransactionType = 'Manual' | 'Automatic' | 'All';

export default function JournalPage() {
  // State
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'journal' | 'coa'>('journal');
  
  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [transactionType, setTransactionType] = useState<TransactionType>('All');
  const [accountFilter, setAccountFilter] = useState<string>('');
  
  // Detail modal
  const [selectedEntry, setSelectedEntry] = useState<JournalEntryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch journal entries with filters
      let journalData: JournalEntry[] = [];
      try {
        const result = await accountingService.fetchJournalEntries({
          page: currentPage,
          pageSize,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          transactionType,
          glAccountCode: accountFilter || undefined,
          sortBy,
          sortOrder,
        });
        journalData = result.entries;
      } catch (journalErr) {
        console.warn('Paginated journal endpoint failed, trying alternatives:', journalErr);
        try {
          journalData = await accountingService.getJournalEntries();
        } catch (altErr) {
          console.warn('Alternative journal endpoint also failed:', altErr);
          journalData = [];
        }
      }

      // Fetch trial balance
      let tbData: TrialBalanceItem[] = [];
      try {
        tbData = await accountingService.getTrialBalance();
      } catch (tbErr1) {
        console.warn('Main trial balance endpoint failed, trying alternatives:', tbErr1);
        try {
          tbData = await accountingService.getTrialBalanceAlt();
        } catch (tbErr2) {
          console.warn('Alternative trial balance endpoint failed:', tbErr2);
          tbData = [];
        }
      }

      setEntries(journalData);
      setTrialBalance(tbData);
      
      // Don't treat empty data as an error — the ledger may simply be empty
      if (journalData.length === 0 && tbData.length === 0) {
        console.info('No accounting data found — ledger may be empty or not yet initialized.');
        // Show informational notice but not a red error
        setError(null);
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
  }, [currentPage, startDate, endDate, transactionType, accountFilter, sortBy, sortOrder]);

  const fetchEntryDetail = async (entryId: string) => {
    try {
      setDetailLoading(true);
      const detail = await accountingService.fetchJournalEntryById(entryId);
      setSelectedEntry(detail);
    } catch (err) {
      console.error('Failed to fetch entry detail:', err);
      setError('Failed to load entry details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExportPdf = async (entryId: string) => {
    try {
      const blob = await accountingService.exportJournalEntryPdf(entryId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `journal-entry-${entryId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export PDF');
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter entries based on search
  const filteredEntries = entries.filter(je => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (je.journalEntryCode && je.journalEntryCode.toLowerCase().includes(q)) ||
      (je.publicId && je.publicId.toLowerCase().includes(q)) ||
      je.description.toLowerCase().includes(q) ||
      je.debitAccount.toLowerCase().includes(q) ||
      je.creditAccount.toLowerCase().includes(q) ||
      (je.reference && je.reference.toLowerCase().includes(q))
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredEntries.length / pageSize);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading && entries.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Fetching journal entries...</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <ArrowRightLeft size={20} color="#6366f1" /> Journal Entries
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Balanced double-entry transactions with complete audit trail</p>
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
        <>
          {/* Filters Section */}
          <div className="card" style={{ marginBottom: 16, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Filters & Search</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              {/* Start Date */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
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

              {/* End Date */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
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

              {/* Transaction Type */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Type</label>
                <select
                  value={transactionType}
                  onChange={(e) => {
                    setTransactionType(e.target.value as TransactionType);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--bg-border)',
                    borderRadius: 6,
                    fontSize: 13,
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="All">All Types</option>
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                </select>
              </div>

              {/* Account Filter */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>GL Account</label>
                <input
                  type="text"
                  placeholder="e.g., GL-1000"
                  value={accountFilter}
                  onChange={(e) => {
                    setAccountFilter(e.target.value);
                    setCurrentPage(1);
                  }}
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

            {/* Clear Filters */}
            {(startDate || endDate || transactionType !== 'All' || accountFilter) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setTransactionType('All');
                  setAccountFilter('');
                  setCurrentPage(1);
                }}
                style={{
                  fontSize: 12,
                  color: '#6366f1',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div style={{ marginBottom: 16 }}>
            <CodeSearchBar
              onSearch={setSearch}
              entityType="journalEntry"
              placeholder="Search by entry code, description, or account..."
              showHistory={true}
              autoFocus={false}
            />
          </div>

          {/* Entries Table */}
          <div className="card" style={{ padding: 0, marginBottom: 16 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 16, cursor: 'pointer', userSelect: 'none' }} onClick={() => {
                    if (sortBy === 'code') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('code');
                      setSortOrder('asc');
                    }
                  }}>
                    Entry Code {sortBy === 'code' && (sortOrder === 'asc' ? <ChevronUp size={14} style={{ display: 'inline' }} /> : <ChevronDown size={14} style={{ display: 'inline' }} />)}
                  </th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => {
                    if (sortBy === 'date') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('date');
                      setSortOrder('asc');
                    }
                  }}>
                    Date {sortBy === 'date' && (sortOrder === 'asc' ? <ChevronUp size={14} style={{ display: 'inline' }} /> : <ChevronDown size={14} style={{ display: 'inline' }} />)}
                  </th>
                  <th>Description</th>
                  <th>Transactions</th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => {
                    if (sortBy === 'amount') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('amount');
                      setSortOrder('asc');
                    }
                  }}>
                    Amount {sortBy === 'amount' && (sortOrder === 'asc' ? <ChevronUp size={14} style={{ display: 'inline' }} /> : <ChevronDown size={14} style={{ display: 'inline' }} />)}
                  </th>
                  <th>Reference</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEntries.length > 0 ? (
                  paginatedEntries.map(je => (
                    <tr key={je.id} style={{ cursor: 'pointer' }} onClick={() => fetchEntryDetail(je.id)}>
                      <td className="primary mono" style={{ paddingLeft: 16, fontWeight: 700, color: '#6366f1' }}>
                        {je.journalEntryCode || je.publicId || 'N/A'}
                      </td>
                      <td className="mono" style={{ fontSize: 12 }}>{new Date(je.date).toLocaleDateString()}</td>
                      <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {je.description}
                      </td>
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
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportPdf(je.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 4,
                            color: '#6366f1',
                          }}
                          title="Export to PDF"
                        >
                          <FileText size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      {search ? 'No entries match your search' : 'No journal entries found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredEntries.length)} of {filteredEntries.length} entries
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                >
                  Previous
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '0 8px' }}>
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
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

      {/* Detail Modal */}
      {selectedEntry && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: 12,
            padding: 24,
            maxWidth: 600,
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
          }}>
            <button
              onClick={() => setSelectedEntry(null)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                color: 'var(--text-muted)',
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              Journal Entry {selectedEntry.journalEntryCode || selectedEntry.publicId}
            </h2>

            {detailLoading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                {/* Debit Section */}
                <div style={{ marginBottom: 16, padding: '12px', background: 'rgba(248, 113, 113, 0.1)', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f87171', marginBottom: 8 }}>Debit Lines</div>
                  {selectedEntry.lines?.filter(l => l.debitAmount).map((line, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span>{line.glAccountCode}: {line.description}</span>
                      <span style={{ fontWeight: 600 }}>₹{formatNumber((line.debitAmount || 0) / 100)}</span>
                    </div>
                  ))}
                </div>

                {/* Credit Section */}
                <div style={{ marginBottom: 16, padding: '12px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#34d399', marginBottom: 8 }}>Credit Lines</div>
                  {selectedEntry.lines?.filter(l => l.creditAmount).map((line, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span>{line.glAccountCode}: {line.description}</span>
                      <span style={{ fontWeight: 600 }}>₹{formatNumber((line.creditAmount || 0) / 100)}</span>
                    </div>
                  ))}
                </div>

                {/* Balance Verification */}
                <div style={{
                  padding: '12px',
                  background: selectedEntry.balanceVerified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 8,
                  marginBottom: 16,
                  textAlign: 'center',
                  fontWeight: 700,
                  color: selectedEntry.balanceVerified ? '#34d399' : '#f87171',
                }}>
                  {selectedEntry.balanceVerified ? '✓ BALANCED' : '✗ UNBALANCED'}
                </div>

                {/* Audit Trail */}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <div>Created by {selectedEntry.createdBy} on {new Date(selectedEntry.createdAt || '').toLocaleDateString()}</div>
                  {selectedEntry.lastModified && (
                    <div>Last modified {new Date(selectedEntry.lastModified).toLocaleDateString()}</div>
                  )}
                </div>

                {/* Export Button */}
                <button
                  onClick={() => handleExportPdf(selectedEntry.id)}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 16 }}
                >
                  Export to PDF
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

