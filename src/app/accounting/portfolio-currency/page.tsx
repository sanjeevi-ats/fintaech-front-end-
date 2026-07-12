'use client';

import React, { useState, useEffect } from 'react';
import multiCurrencyService from '@/services/multiCurrencyService';
import type { PortfolioMultiCurrencySummary } from '@/services/multiCurrencyService';

export default function PortfolioCurrencyPage() {
  const [branchId, setBranchId] = useState('');
  const [summary, setSummary] = useState<PortfolioMultiCurrencySummary | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currencies, setCurrencies] = useState(['USD', 'EUR']);

  const handleGenerateSummary = async () => {
    if (!branchId) {
      setMessage('Please enter a branch ID');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const sum =
        await multiCurrencyService.getPortfolioMultiCurrencySummary(
          branchId,
          currencies
        );
      setSummary(sum);
      setMessage('Portfolio summary generated');
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Portfolio in Multiple Currencies
          </h1>
          <p className="text-gray-600 mt-2">
            View your branch portfolio in different currencies
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded ${
              message.includes('Error')
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            }`}
          >
            {message}
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch ID
              </label>
              <input
                type="text"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                placeholder="Enter branch ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currencies
              </label>
              <select
                multiple
                value={currencies}
                onChange={(e) =>
                  setCurrencies(
                    Array.from(e.target.selectedOptions, (option) => option.value)
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="AUD">AUD</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Hold Ctrl to select multiple
              </p>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleGenerateSummary}
                disabled={loading || !branchId}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Loading...' : 'Generate Summary'}
              </button>
            </div>
          </div>
        </div>

        {summary && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Total Loans</div>
                <div className="text-3xl font-bold text-blue-600">
                  {summary.total_loans}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600 mb-2">
                  Primary Currency
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {summary.primary_currency}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600 mb-2">
                  Total Portfolio Value
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {multiCurrencyService.formatAmount(
                    summary.total_portfolio_value,
                    summary.primary_currency
                  )}
                </div>
              </div>
            </div>

            {/* Portfolio by Currency */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Portfolio Breakdown by Currency
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(summary.total_principal_by_currency).map(
                  ([curr, amount]) => (
                    <div
                      key={curr}
                      className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="text-sm text-gray-600">
                            Principal ({curr})
                          </div>
                          <div className="text-2xl font-bold text-blue-700">
                            {multiCurrencyService.formatAmount(amount, curr)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-600">
                            Concentration
                          </div>
                          <div className="text-lg font-semibold text-blue-600">
                            {(
                              summary.concentration_by_currency[curr] || 0
                            ).toFixed(2)}
                            %
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-blue-300">
                        <div className="text-xs text-gray-600 mb-2">
                          Outstanding
                        </div>
                        <div className="text-lg font-semibold text-blue-600">
                          {multiCurrencyService.formatAmount(
                            summary.total_outstanding_by_currency[curr] || 0,
                            curr
                          )}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-blue-300">
                        <div className="text-xs text-gray-600">
                          Loans in {curr}
                        </div>
                        <div className="text-lg font-semibold text-blue-600">
                          {summary.loan_count_by_currency[curr] || 0}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Concentration Analysis */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Concentration Analysis
              </h2>

              <div className="space-y-4">
                {Object.entries(summary.concentration_by_currency).map(
                  ([curr, conc]) => (
                    <div key={curr}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {curr}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {conc.toFixed(2)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            conc > 30
                              ? 'bg-red-500'
                              : conc > 15
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(conc, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Concentration Risk
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Low: &lt; 15% (Green)</li>
                  <li>• Medium: 15-30% (Yellow)</li>
                  <li>• High: &gt; 30% (Red)</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {/* Info Box */}
        {!summary && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              💡 Portfolio Summary Features
            </h3>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li>View total portfolio value in multiple currencies</li>
              <li>Track concentration risks by currency</li>
              <li>Monitor principal and outstanding balances</li>
              <li>Analyze currency diversification</li>
              <li>Track loan counts by currency type</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

