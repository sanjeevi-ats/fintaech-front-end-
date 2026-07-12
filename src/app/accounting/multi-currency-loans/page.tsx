'use client';

import React, { useState, useEffect } from 'react';
import multiCurrencyService from '@/services/multiCurrencyService';
import type {
  CurrencyEquivalentReport,
  CurrencyLoanBreakdown,
} from '@/services/multiCurrencyService';

export default function MultiCurrencyLoansPage() {
  const [loanId, setLoanId] = useState('');
  const [report, setReport] = useState<CurrencyEquivalentReport | null>(null);
  const [breakdown, setBreakdown] = useState<CurrencyLoanBreakdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currencies, setCurrencies] = useState(['USD', 'EUR', 'GBP']);

  const handleGenerateReport = async () => {
    if (!loanId) {
      setMessage('Please enter a loan ID');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const rep = await multiCurrencyService.generateLoanEquivalentReport(
        loanId,
        currencies
      );
      setReport(rep);

      const bd = await multiCurrencyService.getLoanBreakdown(loanId);
      setBreakdown(bd);

      setMessage('Report generated successfully');
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
            Multi-Currency Loans
          </h1>
          <p className="text-gray-600 mt-2">
            View loan details in multiple currencies
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
                Loan ID
              </label>
              <input
                type="text"
                value={loanId}
                onChange={(e) => setLoanId(e.target.value)}
                placeholder="Enter loan ID"
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
                onClick={handleGenerateReport}
                disabled={loading || !loanId}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Loan Breakdown */}
        {breakdown.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Loan Breakdown by Currency
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Currency
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Principal
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Outstanding
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Total Interest
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Interest Rate
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {breakdown.map((item) => (
                    <tr
                      key={item.currency}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.currency}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600">
                        {multiCurrencyService.formatAmount(
                          item.principal,
                          item.currency
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600">
                        {multiCurrencyService.formatAmount(
                          item.outstanding,
                          item.currency
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600">
                        {multiCurrencyService.formatAmount(
                          item.total_interest,
                          item.currency
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600">
                        {item.interest_rate.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600">
                        {item.exchange_rate.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Equivalent Report */}
        {report && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Loan Equivalents Report
            </h2>
            <p className="text-gray-600 mb-6">
              Loan Code: <span className="font-semibold">{report.loan_code}</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {/* Base Currency Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                <div className="text-sm text-gray-600 mb-2">Base Amount</div>
                <div className="text-2xl font-bold text-blue-700 mb-2">
                  {multiCurrencyService.formatAmount(
                    report.base_principal,
                    report.base_currency
                  )}
                </div>
                <div className="text-xs text-gray-600">
                  {report.base_currency}
                </div>
              </div>

              {/* Equivalent Amounts */}
              {report.equivalents_in_currencies.map((equiv) => (
                <div
                  key={equiv.currency}
                  className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200"
                >
                  <div className="text-sm text-gray-600 mb-2">
                    {equiv.currency} Equivalent
                  </div>
                  <div className="text-2xl font-bold text-green-700 mb-2">
                    {multiCurrencyService.formatAmount(
                      equiv.amount,
                      equiv.currency
                    )}
                  </div>
                  <div className="text-xs text-gray-600">
                    Rate: {equiv.rate.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>

            {/* Rates Used Table */}
            <div className="overflow-x-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Exchange Rates Used
              </h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">
                      From
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">
                      To
                    </th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-900">
                      Rate
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {report.rates_used.map((rate, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-3">{rate.from_currency}</td>
                      <td className="px-6 py-3">{rate.to_currency}</td>
                      <td className="px-6 py-3 text-right font-medium">
                        {rate.rate.toFixed(4)}
                      </td>
                      <td className="px-6 py-3">
                        {new Date(rate.rate_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ How it works</h3>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>Enter a loan ID to view its details in multiple currencies</li>
            <li>Exchange rates are updated regularly from market sources</li>
            <li>All conversions use the current effective rates</li>
            <li>Historical rates are maintained for audit purposes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

