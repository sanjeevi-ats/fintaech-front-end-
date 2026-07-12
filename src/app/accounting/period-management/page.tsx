'use client';
import React, { useState, useEffect } from 'react';
import periodService, { Period } from '@/services/periodService';
import closeService from '@/services/closeService';

export default function PeriodManagementPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      setError('');
      const branchId = localStorage.getItem('branchId') || 'default-branch';
      const data = await periodService.getPeriods(branchId);
      setPeriods(data);
    } catch (err: any) {
      setError('Failed to load periods: ' + (err.message || err));
    }
  };

  const handleClosePeriod = async (periodId: string) => {
    if (!confirm('Are you sure you want to close this period?')) return;
    setLoading(true);
    try {
      setError('');
      await closeService.closePeriod(periodId, 'User initiated');
      alert('✓ Period closed successfully');
      await loadPeriods();
    } catch (err: any) {
      setError('Failed to close period: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPeriod = async (periodId: string) => {
    setLoading(true);
    try {
      setError('');
      await periodService.openPeriod(periodId);
      alert('✓ Period opened successfully');
      await loadPeriods();
    } catch (err: any) {
      setError('Failed to open period: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Period Management</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Accounting Periods</h2>
            <button
              onClick={loadPeriods}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loading ? '⏳ Loading...' : '↻ Refresh'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left p-3 font-semibold text-gray-700">Period Code</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Start Date</th>
                  <th className="text-left p-3 font-semibold text-gray-700">End Date</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Closed At</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {periods.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">No periods found</td>
                  </tr>
                ) : (
                  periods.map((period) => (
                    <tr key={period.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-semibold text-gray-900">{period.periodCode}</td>
                      <td className="p-3 text-gray-700">{new Date(period.startDate).toLocaleDateString()}</td>
                      <td className="p-3 text-gray-700">{new Date(period.endDate).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          period.status === 'Open'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {period.status === 'Open' ? '○ Open' : '✓ Closed'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-700">
                        {period.closedAt ? new Date(period.closedAt).toLocaleString() : '-'}
                      </td>
                      <td className="p-3 flex gap-2">
                        {period.status === 'Open' && (
                          <button
                            onClick={() => handleClosePeriod(period.id)}
                            disabled={loading}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            🔒 Close
                          </button>
                        )}
                        {period.status === 'Closed' && (
                          <button
                            onClick={() => handleOpenPeriod(period.id)}
                            disabled={loading}
                            className="px-3 py-1 bg-yellow-600 text-white text-xs rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
                          >
                            ↶ Reopen
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

