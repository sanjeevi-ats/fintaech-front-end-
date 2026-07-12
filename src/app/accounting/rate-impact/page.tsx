'use client';

import React, { useState } from 'react';
import multiCurrencyService from '@/services/multiCurrencyService';
import type { ExchangeRateImpactAnalysis } from '@/services/multiCurrencyService';

export default function RateImpactPage() {
  const [loanId, setLoanId] = useState('');
  const [rateChange, setRateChange] = useState(0.01);
  const [analysis, setAnalysis] = useState<ExchangeRateImpactAnalysis | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAnalyze = async () => {
    if (!loanId) {
      setMessage('Please enter a loan ID');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const result =
        await multiCurrencyService.analyzeExchangeRateImpact(loanId, rateChange);
      setAnalysis(result);
      setMessage('Impact analysis completed');
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
            Exchange Rate Impact Analysis
          </h1>
          <p className="text-gray-600 mt-2">
            Analyze the impact of exchange rate changes on loans
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

        {/* Input Section */}
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
                Rate Change (absolute)
              </label>
              <input
                type="number"
                step="0.0001"
                value={rateChange}
                onChange={(e) => setRateChange(parseFloat(e.target.value) || 0)}
                placeholder="e.g., 0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Positive = rate increase, Negative = rate decrease
              </p>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleAnalyze}
                disabled={loading || !loanId}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Analyzing...' : 'Analyze Impact'}
              </button>
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        {analysis && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Current Rate</div>
                <div className="text-3xl font-bold text-blue-600">
                  {analysis.current_rate.toFixed(4)}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Proposed Rate</div>
                <div className="text-3xl font-bold text-orange-600">
                  {analysis.proposed_rate.toFixed(4)}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Rate Change</div>
                <div
                  className={`text-3xl font-bold ${
                    analysis.rate_change > 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {analysis.rate_change > 0 ? '+' : ''}
                  {analysis.rate_change.toFixed(4)}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600 mb-2">
                  Impact Percentage
                </div>
                <div
                  className={`text-3xl font-bold ${
                    analysis.impact_percentage > 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                  style={{
                    color: multiCurrencyService.getImpactColor(
                      Math.abs(analysis.impact_percentage)
                    ),
                  }}
                >
                  {analysis.impact_percentage > 0 ? '+' : ''}
                  {analysis.impact_percentage.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Outstanding Impact */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Outstanding Amount Impact
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-gray-600 mb-2">
                    Current Outstanding
                  </div>
                  <div className="text-3xl font-bold text-blue-700">
                    {multiCurrencyService.formatAmount(
                      analysis.current_outstanding,
                      analysis.currency
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div
                    className="text-4xl"
                    style={{
                      color: multiCurrencyService.getImpactColor(
                        Math.abs(analysis.impact_percentage)
                      ),
                    }}
                  >
                    →
                  </div>
                </div>

                <div
                  className="p-6 rounded-lg border-2"
                  style={{
                    backgroundColor:
                      analysis.impact_direction === 'Negative'
                        ? '#fee2e2'
                        : '#ecfdf5',
                    borderColor:
                      analysis.impact_direction === 'Negative'
                        ? '#fecaca'
                        : '#bbf7d0',
                  }}
                >
                  <div className="text-sm text-gray-600 mb-2">
                    After Rate Change
                  </div>
                  <div
                    className="text-3xl font-bold"
                    style={{
                      color:
                        analysis.impact_direction === 'Negative'
                          ? '#dc2626'
                          : '#059669',
                    }}
                  >
                    {multiCurrencyService.formatAmount(
                      analysis.outstanding_after_rate_change,
                      analysis.currency
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 rounded-lg" style={{
                backgroundColor:
                  analysis.impact_direction === 'Negative' ? '#fef2f2' : '#f0fdf4',
                border: `2px solid ${
                  analysis.impact_direction === 'Negative'
                    ? '#fca5a5'
                    : '#86efac'
                }`,
              }}>
                <div className="flex items-center mb-2">
                  <span className="text-2xl font-bold" style={{
                    color:
                      analysis.impact_direction === 'Negative'
                        ? '#dc2626'
                        : '#059669',
                  }}>
                    {analysis.impact_direction === 'Negative' ? '↑' : '↓'}
                  </span>
                  <span
                    className="text-2xl font-bold ml-2"
                    style={{
                      color:
                        analysis.impact_direction === 'Negative'
                          ? '#dc2626'
                          : '#059669',
                    }}
                  >
                    Impact: {multiCurrencyService.formatAmount(
                      Math.abs(analysis.impact_amount),
                      analysis.currency
                    )}
                  </span>
                </div>
                <div className="text-sm" style={{
                  color:
                    analysis.impact_direction === 'Negative'
                      ? '#7f1d1d'
                      : '#15803d',
                }}>
                  {analysis.impact_direction === 'Negative'
                    ? 'Loan value will increase (unfavorable)'
                    : 'Loan value will decrease (favorable)'}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Recommendations
                </h2>

                <div className="space-y-3">
                  {analysis.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="flex items-start p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                    >
                      <div className="text-xl mr-3">⚠️</div>
                      <p className="text-gray-800">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loan Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Loan Details
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Loan ID</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {analysis.loan_id}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Loan Code</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {analysis.loan_code}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Currency</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {analysis.currency}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Status</div>
                  <div
                    className="text-lg font-semibold px-3 py-1 rounded inline-block"
                    style={{
                      backgroundColor:
                        analysis.impact_direction === 'Negative'
                          ? '#fee2e2'
                          : '#ecfdf5',
                      color:
                        analysis.impact_direction === 'Negative'
                          ? '#dc2626'
                          : '#059669',
                    }}
                  >
                    {analysis.impact_direction}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Info Box */}
        {!analysis && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              📊 How Exchange Rate Impact Works
            </h3>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li>
                Enter a loan ID and the expected rate change (in absolute terms)
              </li>
              <li>The system calculates the impact on loan outstanding amount</li>
              <li>
                Positive impact % = adverse (loan value increases with rate increase)
              </li>
              <li>
                Negative impact % = favorable (loan value decreases with rate increase)
              </li>
              <li>
                Recommendations are provided for high-impact scenarios (&gt; 5%)
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

