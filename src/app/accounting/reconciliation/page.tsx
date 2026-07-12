'use client';
import React, { useState, useEffect } from 'react';
import reconciliationService from '@/services/reconciliationService';
import periodService, { Period } from '@/services/periodService';

export default function ReconciliationPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [selectedTab, setSelectedTab] = useState<'bank' | 'loans' | 'collections'>('bank');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bankResults, setBankResults] = useState<any>(null);
  const [loanResults, setLoanResults] = useState<any>(null);
  const [collectionResults, setCollectionResults] = useState<any>(null);

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      setError('');
      const branchId = localStorage.getItem('branchId') || 'default-branch';
      const data = await periodService.getPeriods(branchId);
      setPeriods(data);
      if (data.length > 0) setSelectedPeriod(data[0]);
    } catch (err: any) {
      setError('Failed to load periods: ' + (err.message || err));
    }
  };

  const reconcileBank = async () => {
    if (!selectedPeriod?.id) {
      setError('Please select a period');
      return;
    }
    setLoading(true);
    try {
      setError('');
      const result = await reconciliationService.reconcileBank(selectedPeriod.id);
      setBankResults(result);
    } catch (err: any) {
      setError('Bank reconciliation failed: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const reconcileLoans = async () => {
    if (!selectedPeriod?.id) {
      setError('Please select a period');
      return;
    }
    setLoading(true);
    try {
      setError('');
      const result = await reconciliationService.reconcileLoans(selectedPeriod.id);
      setLoanResults(result);
    } catch (err: any) {
      setError('Loan reconciliation failed: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const reconcileCollections = async () => {
    if (!selectedPeriod?.id) {
      setError('Please select a period');
      return;
    }
    setLoading(true);
    try {
      setError('');
      const result = await reconciliationService.reconcileCollections(selectedPeriod.id);
      setCollectionResults(result);
    } catch (err: any) {
      setError('Collection reconciliation failed: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Reconciliation Portal</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
            {error}
          </div>
        )}

        {/* Period Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Period</label>
          <select
            value={selectedPeriod?.id || ''}
            onChange={(e) => {
              const p = periods.find(x => x.id === e.target.value);
              setSelectedPeriod(p || null);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900"
          >
            <option value="">-- Select a Period --</option>
            {periods.map(p => (
              <option key={p.id} value={p.id}>
                {p.periodCode} ({p.startDate} to {p.endDate})
              </option>
            ))}
          </select>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6">
          {(['bank', 'loans', 'collections'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setSelectedTab(tab);
                if (tab === 'bank') reconcileBank();
                else if (tab === 'loans') reconcileLoans();
                else reconcileCollections();
              }}
              disabled={loading || !selectedPeriod}
              className={`px-6 py-2 rounded-md transition-colors font-medium ${
                selectedTab === tab
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {tab === 'bank' && '🏦'} {tab === 'loans' && '💰'} {tab === 'collections' && '📊'}
              {' '}{tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Bank Reconciliation */}
        {selectedTab === 'bank' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Bank Reconciliation</h2>
            {bankResults ? (
              <div>
                {bankResults.isReconciled ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <p className="text-green-700 font-semibold mb-3">✓ Reconciled Successfully</p>
                    <div className="space-y-2 text-gray-700">
                      <p>Bank Balance: <strong>₹{(bankResults.bankBalance / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></p>
                      <p>Ledger Balance: <strong>₹{(bankResults.ledgerBalance / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></p>
                      <p>Difference: <strong className={bankResults.difference === 0 ? 'text-green-600' : 'text-red-600'}>₹{(bankResults.difference / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-700 font-semibold">⚠ Not Reconciled</p>
                    {bankResults.discrepancies?.length > 0 && (
                      <ul className="mt-2 text-yellow-700">
                        {bankResults.discrepancies.map((d: string, i: number) => (
                          <li key={i}>• {d}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600">Click "Bank Reconciliation" button to start</p>
            )}
          </div>
        )}

        {/* Loan Reconciliation */}
        {selectedTab === 'loans' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Loan Ledger Reconciliation</h2>
            {loanResults ? (
              <div>
                {loanResults.reconciled ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <p className="text-green-700 font-semibold mb-3">✓ Reconciled Successfully</p>
                    <div className="space-y-2 text-gray-700">
                      <p>Total Loans: <strong>{loanResults.totalLoans}</strong></p>
                      <p>Total Balance: <strong>₹{(loanResults.totalBalance / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-700 font-semibold">⚠ Issues Found</p>
                    {loanResults.issues?.length > 0 && (
                      <ul className="mt-2 text-yellow-700">
                        {loanResults.issues.map((issue: string, i: number) => (
                          <li key={i}>• {issue}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600">Click "Loans" button to start</p>
            )}
          </div>
        )}

        {/* Collection Reconciliation */}
        {selectedTab === 'collections' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Collection Reconciliation</h2>
            {collectionResults ? (
              <div>
                {collectionResults.reconciled ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <p className="text-green-700 font-semibold mb-3">✓ Reconciled Successfully</p>
                    <div className="space-y-2 text-gray-700">
                      <p>Total Collections: <strong>{collectionResults.totalCollections}</strong></p>
                      <p>Cash Received: <strong>₹{(collectionResults.cashReceived / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-700 font-semibold">⚠ Issues Found</p>
                    {collectionResults.issues?.length > 0 && (
                      <ul className="mt-2 text-yellow-700">
                        {collectionResults.issues.map((issue: string, i: number) => (
                          <li key={i}>• {issue}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600">Click "Collections" button to start</p>
            )}
          </div>
        )}

        {loading && <p className="text-center text-gray-600 mt-4">⏳ Reconciling...</p>}
      </div>
    </div>
  );
}

