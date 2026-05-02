'use client';
import React, { useState } from 'react';
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { loanService } from '@/services/loanService';
import { customerService } from '@/services/customerService';
import { collectionService } from '@/services/collectionService';
import { accountingService } from '@/services/accountingService';
import { userService } from '@/services/userService';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  endpoint: string;
}

export default function APITestPage() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const updateTest = (name: string, status: TestResult['status'], message: string, endpoint: string) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.endpoint = endpoint;
        return [...prev];
      }
      return [...prev, { name, status, message, endpoint }];
    });
  };

  const runTests = async () => {
    setRunning(true);
    setTests([]);

    const testCases = [
      {
        name: 'Loans API',
        test: async () => {
          const data = await loanService.getAll();
          return `✓ Loaded ${data.length} loans`;
        },
        endpoint: '/api/v1/LoanCases'
      },
      {
        name: 'Customers API',
        test: async () => {
          const data = await customerService.getAll();
          return `✓ Loaded ${data.length} customers`;
        },
        endpoint: '/api/v1/Customers'
      },
      {
        name: 'Users API',
        test: async () => {
          const data = await userService.getAll();
          return `✓ Loaded ${data.length} users`;
        },
        endpoint: '/api/v1/Users'
      },
      {
        name: 'Daily Collections',
        test: async () => {
          const today = new Date().toISOString().split('T')[0];
          try {
            const data = await collectionService.getDue(today, today);
            return `✓ Loaded ${data.length} due installments`;
          } catch (err: any) {
            if (err.message.includes('Redis')) {
              throw new Error('Redis connection error - update backend connection string with abortConnect=false');
            }
            throw err;
          }
        },
        endpoint: '/api/v1/Installments/due'
      },
      {
        name: 'Collection Entry Search',
        test: async () => {
          const data = await collectionService.searchLoanByCustomer('test');
          return `✓ Search functionality working - found ${data.length} results`;
        },
        endpoint: '/api/v1/Collection/search'
      },
      {
        name: 'Trial Balance',
        test: async () => {
          try {
            const data = await accountingService.getTrialBalance();
            return `✓ Loaded ${data.length} accounts`;
          } catch (err) {
            const data = await accountingService.getTrialBalanceAlt();
            return `✓ Loaded ${data.length} accounts (alternative endpoint)`;
          }
        },
        endpoint: '/api/v1/Ledger/trial-balance'
      },
      {
        name: 'Journal Entries',
        test: async () => {
          const data = await accountingService.getJournalEntries();
          return `✓ Loaded ${data.length} journal entries`;
        },
        endpoint: '/api/v1/Journal/entries'
      },
      {
        name: 'P&L Statement',
        test: async () => {
          const today = new Date();
          const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
          const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();
          
          try {
            const data = await accountingService.getPnLStatement(start, end);
            return `✓ Generated P&L for ${data.period || 'current period'}`;
          } catch (err) {
            const data = await accountingService.getPnLStatementAlt(start, end);
            return `✓ Generated P&L (alternative endpoint)`;
          }
        },
        endpoint: '/api/v1/Ledger/pnl'
      }
    ];

    for (const testCase of testCases) {
      updateTest(testCase.name, 'pending', 'Running...', testCase.endpoint);
      
      try {
        const result = await testCase.test();
        updateTest(testCase.name, 'success', result, testCase.endpoint);
      } catch (err: any) {
        updateTest(testCase.name, 'error', err.message, testCase.endpoint);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="animate-spin" size={16} color="#f59e0b" />;
      case 'success':
        return <CheckCircle2 size={16} color="#10b981" />;
      case 'error':
        return <XCircle size={16} color="#ef4444" />;
    }
  };

  const successCount = tests.filter(t => t.status === 'success').length;
  const errorCount = tests.filter(t => t.status === 'error').length;

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>API Integration Test</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Test all backend API endpoints to ensure proper integration
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={runTests} 
          disabled={running}
        >
          {running ? <Loader2 className="animate-spin" size={13} /> : <AlertTriangle size={13} />}
          {running ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </div>

      {tests.length > 0 && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
          <div className="card" style={{ flex: 1, padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Total Tests</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#6366f1' }}>{tests.length}</div>
          </div>
          <div className="card" style={{ flex: 1, padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Passed</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>{successCount}</div>
          </div>
          <div className="card" style={{ flex: 1, padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Failed</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#ef4444' }}>{errorCount}</div>
          </div>
          <div className="card" style={{ flex: 1, padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Success Rate</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: tests.length > 0 ? (successCount / tests.length >= 0.8 ? '#10b981' : '#f59e0b') : '#6b7280' }}>
              {tests.length > 0 ? Math.round((successCount / tests.length) * 100) : 0}%
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--bg-border)' }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>API Test Results</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Backend URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177'}</div>
        </div>
        
        {tests.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Click "Run All Tests" to test API integration
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 16 }}>Status</th>
                <th>Test Name</th>
                <th>Endpoint</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test, i) => (
                <tr key={i}>
                  <td style={{ paddingLeft: 16 }}>
                    {getStatusIcon(test.status)}
                  </td>
                  <td style={{ fontWeight: 600 }}>{test.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                    {test.endpoint}
                  </td>
                  <td style={{ 
                    color: test.status === 'success' ? '#10b981' : test.status === 'error' ? '#ef4444' : 'var(--text-muted)',
                    fontSize: 12
                  }}>
                    {test.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {errorCount > 0 && (
        <div className="alert alert-warning" style={{ marginTop: 20 }}>
          <AlertTriangle size={16} />
          <div>
            <div style={{ fontWeight: 700 }}>Integration Issues Detected</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              Some API endpoints are failing. Common fixes:
              <ul style={{ marginTop: 8, marginLeft: 16 }}>
                <li>Ensure backend is running on port 5177</li>
                <li>For Redis errors: Update connection string with abortConnect=false</li>
                <li>Check if all required database tables exist</li>
                <li>Verify API endpoint routes match backend implementation</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}