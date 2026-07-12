'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import closeService, { CloseStatusDto } from '@/services/closeService';
import periodService, { Period } from '@/services/periodService';

export default function CloseStatusPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [status, setStatus] = useState<CloseStatusDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      setError('');
      const branchId = localStorage.getItem('branchId') || 'default-branch';
      const data = await periodService.getPeriods(branchId);
      setPeriods(data);
      if (data.length > 0) {
        setSelectedPeriod(data[0]);
      }
    } catch (err: any) {
      setError('Failed to load periods: ' + (err.message || err));
    }
  };

  useEffect(() => {
    if (selectedPeriod?.id) {
      loadStatus();
    }
  }, [selectedPeriod]);

  const loadStatus = async () => {
    if (!selectedPeriod?.id) return;
    setLoading(true);
    try {
      setError('');
      const st = await closeService.getCloseStatus(selectedPeriod.id);
      setStatus(st);
    } catch (err: any) {
      setError('Failed to load status: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!selectedPeriod?.id) {
      setError('Please select a period');
      return;
    }
    setLoading(true);
    try {
      setError('');
      const result = await closeService.validateCloseReadiness(selectedPeriod.id);
      if (result.isReady) {
        alert('✓ Period is ready to close');
      } else {
        alert('⚠ Issues found: ' + (result.issues?.join(', ') || 'Unknown issue'));
      }
    } catch (err: any) {
      setError('Validation failed: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (!selectedPeriod?.id) {
      setError('Please select a period');
      return;
    }
    setLoading(true);
    try {
      setError('');
      await closeService.closePeriod(selectedPeriod.id, 'User initiated');
      alert('✓ Period closed successfully');
      await loadStatus();
    } catch (err: any) {
      setError('Close failed: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleReverse = async () => {
    if (!selectedPeriod?.id) {
      setError('Please select a period');
      return;
    }
    if (!confirm('Are you sure you want to reverse this close? This cannot be undone.')) {
      return;
    }
    setLoading(true);
    try {
      setError('');
      await closeService.reversePeriod(selectedPeriod.id, 'User initiated');
      alert('✓ Period close reversed successfully');
      await loadStatus();
    } catch (err: any) {
      setError('Reverse failed: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Month-End Close Status</h1>

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
                {p.periodCode} ({p.startDate} to {p.endDate}) - {p.status}
              </option>
            ))}
          </select>
        </div>

        {/* Status Display */}
        {status && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Period Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Period Code</p>
                <p className="text-lg font-semibold text-gray-900">{status.periodCode}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold">
                  {status.status === 'Closed' ? (
                    <span className="text-green-600">✓ Closed</span>
                  ) : (
                    <span className="text-blue-600">○ Open</span>
                  )}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Start Date</p>
                <p className="text-gray-900">{status.startDate}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">End Date</p>
                <p className="text-gray-900">{status.endDate}</p>
              </div>
              {status.closedAt && (
                <>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Closed At</p>
                    <p className="text-gray-900">{new Date(status.closedAt).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Closed By</p>
                    <p className="text-gray-900">{status.closedBy || 'System'}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Actions</h2>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleValidate}
              disabled={loading || !selectedPeriod}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Validating...' : '✓ Validate Readiness'}
            </button>
            
            {status?.status === 'Open' && (
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Closing...' : '🔒 Close Period'}
              </button>
            )}

            {status?.status === 'Closed' && (
              <button
                onClick={handleReverse}
                disabled={loading}
                className="px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Reversing...' : '↶ Reverse Close'}
              </button>
            )}

            <button
              onClick={loadPeriods}
              disabled={loading}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Loading...' : '↻ Refresh'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

