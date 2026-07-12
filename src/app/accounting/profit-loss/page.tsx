'use client';
import React, { useState, useEffect } from 'react';
import closeService, { ProfitLossStatement } from '@/services/closeService';
import periodService, { Period } from '@/services/periodService';

export default function ProfitLossPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [pl, setPl] = useState<ProfitLossStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (selectedPeriod?.id) {
      loadProfitLoss();
    }
  }, [selectedPeriod]);

  const loadProfitLoss = async () => {
    if (!selectedPeriod?.id) return;
    setLoading(true);
    try {
      setError('');
      const data = await closeService.getProfitLoss(selectedPeriod.id);
      setPl(data);
    } catch (err: any) {
      setError('Failed to load P&L: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedPeriod?.id) {
      setError('Please select a period');
      return;
    }
    try {
      const blob = await closeService.exportPDF(selectedPeriod.id, 'pl');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PL-${selectedPeriod.periodCode}.pdf`;
      a.click();
    } catch (err: any) {
      setError('PDF export failed: ' + (err.message || err));
    }
  };

  const handleExportExcel = async () => {
    if (!selectedPeriod?.id) {
      setError('Please select a period');
      return;
    }
    try {
      const blob = await closeService.exportExcel(selectedPeriod.id, 'pl');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PL-${selectedPeriod.periodCode}.xlsx`;
      a.click();
    } catch (err: any) {
      setError('Excel export failed: ' + (err.message || err));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Profit & Loss Statement</h1>

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

        {/* P&L Statement Display */}
        {pl && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-6 text-gray-900">{pl.periodCode} - Profit & Loss Statement</h2>
            
            <div className="space-y-1 mb-4">
              <p className="text-sm text-gray-600">
                {new Date(pl.startDate).toLocaleDateString()} to {new Date(pl.endDate).toLocaleDateString()}
              </p>
            </div>

            <div className="border-b border-gray-300 pb-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-700 font-medium">Total Income</span>
                <span className="text-lg font-semibold text-green-600">
                  ₹{(pl.totalIncome / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-700 font-medium">Total Expenses</span>
                <span className="text-lg font-semibold text-red-600">
                  ₹{(pl.totalExpenses / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded border-2 border-gray-300">
              <span className="text-xl font-bold text-gray-900">Net Profit / (Loss)</span>
              <span className={`text-2xl font-bold ${pl.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{(pl.netProfit / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Export Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleExportPDF}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                📄 Download PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                📊 Download Excel
              </button>
              <button
                onClick={loadProfitLoss}
                disabled={loading}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {loading ? '⏳ Loading...' : '↻ Refresh'}
              </button>
            </div>
          </div>
        )}

        {loading && <p className="text-center text-gray-600">⏳ Loading P&L statement...</p>}
      </div>
    </div>
  );
}

