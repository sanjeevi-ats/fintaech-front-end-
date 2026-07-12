'use client';
import React, { useState, useEffect } from 'react';
import { Scale, Loader2, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { accountingService, LedgerAccount, AccountStatement } from '@/services/accountingService';

type SortField = 'code' | 'balance';
type SortOrder = 'asc' | 'desc';
type AccountType = 'Asset' | 'Liability' | 'Equity' | 'All';

export default function LedgerPage() {
  // Ledger Accounts View
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [totalEquity, setTotalEquity] = useState(0);
  const [isBalanced, setIsBalanced] = useState(false);
  
  // Sorting & Filtering
  const [sortBy, setSortBy] = useState<SortField>('code');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [accountTypeFilter, setAccountTypeFilter] = useState<AccountType>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  
  // Account Statement View
  const [selectedAccount, setSelectedAccount] = useState<LedgerAccount | null>(null);
  const [statement, setStatement] = useState<AccountStatement[]>([]);
  const [statementSummary, setStatementSummary] = useState<{
    openingBalance: number;
    totalDebits: number;
    totalCredits: number;
    closingBalance: number;
  } | null>(null);
  const [stmtFromDate, setStmtFromDate] = useState<string>('');
  const [stmtToDate, setStmtToDate] = useState<string>('');
  const [stmtSearch, setStmtSearch] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'ledger' | 'statement'>('ledger');

  const fetchLedgerAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await accountingService.fetchLedgerAccounts({
        accountType: accountTypeFilter,
        sortBy,
        sortOrder,
      });
      setAccounts(result.accounts);
      setTotalAssets(result.totalAssets);
      setTotalLiabilities(result.totalLiabilities);
      setTotalEquity(result.totalEquity);
      setIsBalanced(result.isBalanced);
    } catch (err: any) {
      console.error('Fetch ledger accounts error:', err);
      setError('Failed to load ledger accounts. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountStatement = async (code: string) => {
    try {
      setLoading(true);
      const result = await accountingService.fetchAccountStatement(code, {
        fromDate: stmtFromDate || undefined,
        toDate: stmtToDate || undefined,
        searchText: stmtSearch || undefined,
      });
      setStatement(result.transactions);
      setStatementSummary({
        openingBalance: result.openingBalance,
        totalDebits: result.totalDebits,
        totalCredits: result.totalCredits,
        closingBalance: result.closingBalance,
      });
    } catch (err: any) {
      console.error('Fetch account statement error:', err);
      setError('Failed to load account statement.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountClick = (account: LedgerAccount) => {
    setSelectedAccount(account);
    setView('statement');
    fetchAccountStatement(account.code);
  };

  const handleBackToLedger = () => {
    setView('ledger');
    setSelectedAccount(null);
    setStatement([]);
    setStatementSummary(null);
  };

  useEffect(() => {
    if (view === 'ledger') {
      fetchLedgerAccounts();
    }
  }, [view, sortBy, sortOrder, accountTypeFilter]);

  useEffect(() => {
    if (selectedAccount && (stmtFromDate || stmtToDate || stmtSearch)) {
      fetchAccountStatement(selectedAccount.code);
    }
  }, [stmtFromDate, stmtToDate, stmtSearch, selectedAccount]);

  if (loading && accounts.length === 0 && view === 'ledger') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading ledger accounts...</p>
      </div>
    );
  }

  if (view === 'ledger') {
    const filteredAccounts = accountTypeFilter === 'All'
      ? accounts
      : accounts.filter(a => a.type === accountTypeFilter);

    const paginatedAccounts = filteredAccounts.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
    const totalPages = Math.ceil(filteredAccounts.length / pageSize);

    return (
      <div className="fade-in-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Scale size={20} color="#6366f1" /> General Ledger
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>GL account balances and accounting equation verification</p>
          </div>
          <button className="btn btn-secondary" onClick={fetchLedgerAccounts}>Refresh</button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 20, borderRadius: 12 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              Total Assets
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#6366f1' }}>₹{formatNumber(totalAssets / 100)}</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              Total Liabilities
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>₹{formatNumber(totalLiabilities / 100)}</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              Total Equity
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#8b5cf6' }}>₹{formatNumber(totalEquity / 100)}</div>
          </div>
        </div>

        {/* Accounting Equation */}
        <div className="card" style={{
          marginBottom: 20,
          padding: 16,
          background: isBalanced ? 'rgba(99, 102, 241, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          border: `1px solid ${isBalanced ? 'rgba(99, 102, 241, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>ASSETS</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#6366f1' }}>₹{formatNumber(totalAssets / 100)}</div>
            </div>
            <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>=</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>LIABILITIES + EQUITY</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#f59e0b' }}>
                ₹{formatNumber((totalLiabilities + totalEquity) / 100)}
              </div>
            </div>
            <div style={{
              padding: '8px 16px',
              background: isBalanced ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              color: isBalanced ? '#34d399' : '#f87171',
            }}>
              {isBalanced ? '✓ BALANCED' : '✗ UNBALANCED'}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: 16, padding: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>
            Account Type
          </label>
          <select
            value={accountTypeFilter}
            onChange={(e) => {
              setAccountTypeFilter(e.target.value as AccountType);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              maxWidth: 200,
              padding: '8px 12px',
              border: '1px solid var(--bg-border)',
              borderRadius: 6,
              fontSize: 13,
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="All">All Types</option>
            <option value="Asset">Assets</option>
            <option value="Liability">Liabilities</option>
            <option value="Equity">Equity</option>
          </select>
        </div>

        {/* Ledger Table */}
        <div className="card" style={{ padding: 0 }}>
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
                  Account Code {sortBy === 'code' && (sortOrder === 'asc' ? <ChevronUp size={14} style={{ display: 'inline' }} /> : <ChevronDown size={14} style={{ display: 'inline' }} />)}
                </th>
                <th>Account Name</th>
                <th>Type</th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => {
                  if (sortBy === 'balance') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('balance');
                    setSortOrder('asc');
                  }
                }}>
                  Balance {sortBy === 'balance' && (sortOrder === 'asc' ? <ChevronUp size={14} style={{ display: 'inline' }} /> : <ChevronDown size={14} style={{ display: 'inline' }} />)}
                </th>
                <th>Debits</th>
                <th>Credits</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAccounts.length > 0 ? (
                paginatedAccounts.map(account => (
                  <tr key={account.code} style={{ cursor: 'pointer' }} onClick={() => handleAccountClick(account)}>
                    <td className="primary mono" style={{ paddingLeft: 16, fontWeight: 700, color: '#6366f1' }}>
                      {account.code}
                    </td>
                    <td>{account.name}</td>
                    <td>
                      <span className="badge" style={{
                        background: account.type === 'Asset' ? 'rgba(99, 102, 241, 0.1)' : account.type === 'Liability' ? 'rgba(249, 158, 11, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                        color: account.type === 'Asset' ? '#6366f1' : account.type === 'Liability' ? '#f59e0b' : '#8b5cf6',
                      }}>
                        {account.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>₹{formatNumber(Math.abs(account.balance) / 100)}</td>
                    <td>₹{formatNumber(account.totalDebits / 100)}</td>
                    <td>₹{formatNumber(account.totalCredits / 100)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    No ledger accounts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredAccounts.length)} of {filteredAccounts.length} accounts
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <div style={{ fontSize: 12, padding: '0 8px', alignSelf: 'center' }}>
                Page {currentPage} of {totalPages}
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Account Statement View
  if (view === 'statement' && selectedAccount) {
    return (
      <div className="fade-in-up">
        <button onClick={handleBackToLedger} className="btn btn-secondary btn-sm" style={{ marginBottom: 16 }}>
          ← Back to Ledger
        </button>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Account Statement</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {selectedAccount.code} · {selectedAccount.name}
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 20, borderRadius: 12 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="card" style={{ marginBottom: 16, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                From Date
              </label>
              <input
                type="date"
                value={stmtFromDate}
                onChange={(e) => setStmtFromDate(e.target.value)}
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
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                To Date
              </label>
              <input
                type="date"
                value={stmtToDate}
                onChange={(e) => setStmtToDate(e.target.value)}
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
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Search Description
              </label>
              <input
                type="text"
                placeholder="Search..."
                value={stmtSearch}
                onChange={(e) => setStmtSearch(e.target.value)}
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

        {/* Statement Summary */}
        {statementSummary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            <div className="card" style={{ padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Opening Balance</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>₹{formatNumber(statementSummary.openingBalance / 100)}</div>
            </div>
            <div className="card" style={{ padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Total Debits</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f87171' }}>₹{formatNumber(statementSummary.totalDebits / 100)}</div>
            </div>
            <div className="card" style={{ padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Total Credits</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#34d399' }}>₹{formatNumber(statementSummary.totalCredits / 100)}</div>
            </div>
            <div className="card" style={{ padding: 12, background: 'rgba(99, 102, 241, 0.08)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Closing Balance</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#6366f1' }}>₹{formatNumber(statementSummary.closingBalance / 100)}</div>
            </div>
          </div>
        )}

        {/* Statement Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto', marginBottom: 12 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading transactions...</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 16 }}>Date</th>
                  <th>Journal Entry Code</th>
                  <th>Description</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Running Balance</th>
                </tr>
              </thead>
              <tbody>
                {statement.length > 0 ? (
                  statement.map((txn, idx) => (
                    <tr key={idx}>
                      <td className="mono" style={{ paddingLeft: 16, fontSize: 12 }}>
                        {new Date(txn.date).toLocaleDateString()}
                      </td>
                      <td className="mono" style={{ fontSize: 12, color: '#6366f1', fontWeight: 600 }}>
                        {txn.journalEntryCode}
                      </td>
                      <td style={{ fontSize: 12 }}>{txn.description}</td>
                      <td style={{ fontSize: 12, color: '#f87171', fontWeight: 600 }}>
                        {txn.debitAmount ? `₹${formatNumber(txn.debitAmount / 100)}` : '-'}
                      </td>
                      <td style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>
                        {txn.creditAmount ? `₹${formatNumber(txn.creditAmount / 100)}` : '-'}
                      </td>
                      <td style={{ fontSize: 12, fontWeight: 700, color: '#6366f1' }}>
                        ₹{formatNumber(txn.runningBalance / 100)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return null;
}
