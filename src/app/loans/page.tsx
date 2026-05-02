'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Eye, Loader2, AlertCircle } from 'lucide-react';
import { formatNumber, getStatusColor } from '@/lib/utils';
import { loanService, LoanCase } from '@/services/loanService';
import { customerService, Customer } from '@/services/customerService';

export default function LoansPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loans, setLoans] = useState<LoanCase[]>([]);
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<LoanCase | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try multiple endpoints to get loan data
      let loanData: LoanCase[] = [];
      try {
        // First try with customer inclusion
        loanData = await loanService.getAllWithCustomers();
      } catch (err1) {
        console.warn('Failed to fetch loans with customers, trying main endpoint:', err1);
        try {
          // Try main endpoint
          loanData = await loanService.getAll();
        } catch (err2) {
          console.warn('Failed to fetch from main endpoint, trying alternative:', err2);
          // Try alternative endpoint
          loanData = await loanService.getAllAlt();
        }
      }

      // Map the data to ensure proper structure
      const mappedLoans = loanData.map(loan => ({
        ...loan,
        // Handle different possible field names from backend
        principal: loan.principal || loan.financeAmount || 0,
        processingFees: loan.processingFees || loan.fileChargesAmount || 0,
        customerName: loan.customerName || loan.customer?.name || 'Unknown Customer'
      }));

      setLoans(mappedLoans);

      // If customer names are not included, fetch them separately
      const loansWithoutNames = mappedLoans.filter(loan => !loan.customerName || loan.customerName === 'Unknown Customer');
      
      if (loansWithoutNames.length > 0) {
        try {
          // Fetch all customers
          let customerData: Customer[] = [];
          try {
            customerData = await customerService.getAll();
          } catch (custErr) {
            console.warn('Failed to fetch from main customer endpoint, trying alternative:', custErr);
            customerData = await customerService.getAllAlt();
          }

          // Create customer lookup map
          const customerMap: Record<string, Customer> = {};
          customerData.forEach(customer => {
            customerMap[customer.id] = customer;
          });
          setCustomers(customerMap);

          // Update loans with customer names
          const updatedLoans = mappedLoans.map(loan => ({
            ...loan,
            customerName: loan.customerName !== 'Unknown Customer' 
              ? loan.customerName 
              : customerMap[loan.customerId]?.name || `Customer ID: ${loan.customerId.slice(0, 8)}...`
          }));
          setLoans(updatedLoans);
        } catch (customerError) {
          console.warn('Failed to fetch customers:', customerError);
          // Continue with existing data, just show customer IDs
        }
      }

    } catch (err: any) {
      console.error('Fetch loans error:', err);
      if (err.message.includes('Redis')) {
        setError('Redis connection error detected. Please ensure Redis server is running or update backend connection string with abortConnect=false.');
      } else {
        setError('Failed to load loan portfolio. Please check if the backend is running on port 5177.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = loans.filter(l => {
    const customerName = l.customerName || customers[l.customerId]?.name || '';
    const matchSearch = customerName.toLowerCase().includes(search.toLowerCase()) || 
                       l.id.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || l.status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading loans...</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Loan Portfolio</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>All loans across branches · {loans.length} records</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchData}>Refresh</button>
          <button className="btn btn-primary btn-sm" onClick={() => window.location.href = '/loans/applications'}><Plus size={13} /> New Application</button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20, borderRadius: 12 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Portfolio (Receivable)', val: `₹${formatNumber(loans.reduce((s, l) => s + (l.totalReceivable || 0), 0) / 100)}`, color: '#6366f1' },
          { label: 'Active', val: loans.filter(l => l.status === 'active').length, color: '#10b981' },
          { label: 'Draft/Pending', val: loans.filter(l => l.status === 'draft' || l.status === 'pending_disburse').length, color: '#f59e0b' },
          { label: 'Closed', val: loans.filter(l => l.status === 'closed').length, color: '#9494aa' },
        ].map((item, i) => (
          <div key={i} className="card" style={{ flex: 1, padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or loan ID..." style={{ paddingLeft: 30, height: 36 }} />
        </div>
        {['all', 'active', 'pending_disburse', 'closed'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
            {f === 'pending_disburse' ? 'Pending Disburse' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ padding: '14px 16px' }}>Loan ID</th>
              <th>Customer</th>
              <th>Principal</th>
              <th>Total Receivable</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(loan => {
              const customerName = loan.customerName || customers[loan.customerId]?.name || `ID: ${loan.customerId.slice(0, 8)}...`;
              const principal = (loan.principal || 0) / 100;
              const totalReceivable = (loan.totalReceivable || 0) / 100;
              
              return (
                <tr key={loan.id}>
                  <td className="primary mono" style={{ paddingLeft: 16 }}>{loan.id.slice(0, 8)}...</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{customerName}</div>
                    {customers[loan.customerId]?.phone && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{customers[loan.customerId].phone}</div>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>₹{principal.toLocaleString()}</td>
                  <td style={{ color: '#fbbf24', fontWeight: 600 }}>₹{totalReceivable.toLocaleString()}</td>
                  <td><span className={`badge ${getStatusColor(loan.status)}`}>{loan.status}</span></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelectedLoan(loan)}><Eye size={12} /> View</button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No loans found matching your search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Loan Detail Modal */}
      {selectedLoan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Loan Details</div>
              <button onClick={() => setSelectedLoan(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <div className="input-label">Loan ID</div>
                <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, fontFamily: 'monospace', fontSize: 12 }}>{selectedLoan.id}</div>
              </div>
              <div>
                <div className="input-label">Status</div>
                <span className={`badge ${getStatusColor(selectedLoan.status)}`}>{selectedLoan.status}</span>
              </div>
              <div>
                <div className="input-label">Customer Name</div>
                <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6 }}>
                  {selectedLoan.customerName || customers[selectedLoan.customerId]?.name || 'Loading...'}
                </div>
              </div>
              <div>
                <div className="input-label">Customer ID</div>
                <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, fontFamily: 'monospace', fontSize: 12 }}>{selectedLoan.customerId}</div>
              </div>
              <div>
                <div className="input-label">Principal Amount</div>
                <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, fontWeight: 600, color: '#6366f1' }}>₹{((selectedLoan.principal || 0) / 100).toLocaleString()}</div>
              </div>
              <div>
                <div className="input-label">Interest Amount</div>
                <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, fontWeight: 600, color: '#f59e0b' }}>₹{((selectedLoan.interestAmount || 0) / 100).toLocaleString()}</div>
              </div>
              <div>
                <div className="input-label">Processing Fees</div>
                <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, fontWeight: 600 }}>₹{((selectedLoan.processingFees || 0) / 100).toLocaleString()}</div>
              </div>
              <div>
                <div className="input-label">Total Receivable</div>
                <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, fontWeight: 700, color: '#10b981' }}>₹{((selectedLoan.totalReceivable || 0) / 100).toLocaleString()}</div>
              </div>
              {selectedLoan.createdAt && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="input-label">Created At</div>
                  <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6 }}>{new Date(selectedLoan.createdAt).toLocaleString()}</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedLoan(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.location.href = `/loans/applications`}>Manage Application</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
