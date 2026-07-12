'use client';
import React, { useState, useEffect } from 'react';
import closeService, { CashFlowStatement } from '@/services/closeService';
import periodService, { Period } from '@/services/periodService';

export default function CashFlowPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [cf, setCf] = useState<CashFlowStatement | null>(null);
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
      loadCashFlow();
    }
  }, [selectedPeriod]);

  const loadCashFlow = async () => {
    if (!selectedPeriod?.id) return;
    setLoading(true);
    try {
      setError('');
      const data = await closeService.getCashFlow(selectedPeriod.id);
      setCf(data);
    } catch (err: any) {
      setError('Failed to load cash flow: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'pdf' | 'excel') => {
    if (!selectedPeriod?.id) {
      setError('Please select a period');
      return;
    }
    try {
      const blob = type === 'pdf' 
        ? await closeService.exportPDF(selectedPeriod.id, 'cf')
        : await closeService.exportExcel(selectedPeriod.id, 'cf');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CashFlow-${selectedPeriod.periodCode}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
    } catch (err: any) {
      setError(`${type.toUpperCase()} export failed: ` + (err.message || err));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Cash Flow Statement</h1>

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

        {/* Cash Flow Statement Display */}
        {cf && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-6 text-gray-900">{cf.periodCode} - Cash Flow Statement</h2>

            <div className="space-y-6">
              {/* Operating Activities */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-800 mb-3">Operating Activities</h3>
                <div className="flex justify-between p-3 bg-blue-50 rounded">
                  <span className="text-gray-700">Net Cash from Operations</span>
                  <span className={`font-semibold ${cf.operatingNetCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{(cf.operatingNetCash / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Investing Activities */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-800 mb-3">Investing Activities</h3>
                <div className="flex justify-between p-3 bg-green-50 rounded">
                  <span className="text-gray-700">Net Cash from Investing</span>
                  <span className={`font-semibold ${cf.investingNetCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{(cf.investingNetCash / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Financing Activities */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-800 mb-3">Financing Activities</h3>
                <div className="flex justify-between p-3 bg-yellow-50 rounded">
                  <span className="text-gray-700">Net Cash from Financing</span>
                  <span className={`font-semibold ${cf.financingNetCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{(cf.financingNetCash / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between p-2">
                  <span className="text-gray-700">Opening Cash Balance</span>
                  <span className="font-medium">₹{(cf.openingCash / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between p-2">
                  <span className="text-gray-700">Net Change in Cash</span>
                  <span className={`font-medium ${cf.netCashChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{(cf.netCashChange / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-blue-100 rounded border-2 border-blue-300 mt-2">
                  <span className="text-lg font-bold text-gray-900">Closing Cash Balance</span>
                  <span className="text-lg font-bold text-blue-600">
                    ₹{(cf.closingCash / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleExport('pdf')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  📄 Download PDF
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  📊 Download Excel
                </button>
                <button
                  onClick={loadCashFlow}
                  disabled={loading}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {loading ? '⏳ Loading...' : '↻ Refresh'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && <p className="text-center text-gray-600">⏳ Loading cash flow statement...</p>}
      </div>
    </div>
  );
}

