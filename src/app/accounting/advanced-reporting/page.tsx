'use client';

import React, { useState, useEffect } from 'react';
import {
  advancedReportingService,
  ComparativeAnalysis,
  BudgetAnalysis,
  PerformanceMetrics,
  ScenarioAnalysis,
} from '@/services/advancedReportingService';

export default function AdvancedReportingPage() {
  const [activeTab, setActiveTab] = useState<'comparative' | 'budget' | 'metrics' | 'scenario'>(
    'metrics'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [comparison, setComparison] = useState<ComparativeAnalysis | null>(null);
  const [budget, setBudget] = useState<BudgetAnalysis | null>(null);
  const [scenario, setScenario] = useState<ScenarioAnalysis | null>(null);

  const [scenarioGrowth, setScenarioGrowth] = useState(10);

  const periodId = '00000000-0000-0000-0000-000000000001';
  const period2Id = '00000000-0000-0000-0000-000000000002';

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await advancedReportingService.getPerformanceMetricsAsync(periodId);
      setMetrics(data);
    } catch (err) {
      setError('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const loadComparison = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await advancedReportingService.comparePeriodsAsync(periodId, period2Id);
      setComparison(data);
    } catch (err) {
      setError('Failed to load comparison');
    } finally {
      setLoading(false);
    }
  };

  const loadBudgetAnalysis = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await advancedReportingService.analyzeBudgetVsActualAsync(periodId);
      setBudget(data);
    } catch (err) {
      setError('Failed to load budget analysis');
    } finally {
      setLoading(false);
    }
  };

  const loadScenario = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await advancedReportingService.runScenarioAsync(periodId, scenarioGrowth);
      setScenario(data);
    } catch (err) {
      setError('Failed to load scenario');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'metrics' && !metrics) loadMetrics();
    if (tab === 'comparative' && !comparison) loadComparison();
    if (tab === 'budget' && !budget) loadBudgetAnalysis();
    if (tab === 'scenario' && !scenario) loadScenario();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Advanced Financial Reporting</h1>
        <p className="text-gray-600 mb-8">Comprehensive analysis, comparisons, and projections</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => handleTabChange('metrics')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'metrics'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Performance Metrics
          </button>
          <button
            onClick={() => handleTabChange('comparative')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'comparative'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Period Comparison
          </button>
          <button
            onClick={() => handleTabChange('budget')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'budget'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Budget Analysis
          </button>
          <button
            onClick={() => handleTabChange('scenario')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'scenario'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Scenario Planning
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-gray-600">Loading data...</div>
          </div>
        )}

        {/* Performance Metrics Tab */}
        {activeTab === 'metrics' && metrics && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profitability Metrics */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profitability</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Return on Equity (RoE)</span>
                  <span className="font-bold text-blue-600">
                    {advancedReportingService.formatPercentage(metrics.roE)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Return on Assets (RoA)</span>
                  <span className="font-bold text-blue-600">
                    {advancedReportingService.formatPercentage(metrics.roA)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Profit Margin</span>
                  <span className="font-bold text-blue-600">
                    {advancedReportingService.formatPercentage(metrics.profitMargin)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Operating Margin</span>
                  <span className="font-bold text-blue-600">
                    {advancedReportingService.formatPercentage(metrics.operatingMargin)}
                  </span>
                </div>
              </div>
            </div>

            {/* Liquidity Metrics */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Liquidity</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Current Ratio</span>
                  <span className="font-bold text-green-600">{metrics.currentRatio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Quick Ratio</span>
                  <span className="font-bold text-green-600">{metrics.quickRatio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Asset Turnover</span>
                  <span className="font-bold text-green-600">{metrics.assetTurnover.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Debt-to-Equity</span>
                  <span className="font-bold text-orange-600">{metrics.debtToEquity.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparative Analysis Tab */}
        {activeTab === 'comparative' && comparison && !loading && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Period Comparison</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Revenue */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-gray-700 font-semibold mb-2">Revenue Change</p>
                <p className="text-2xl font-bold text-blue-600">
                  {advancedReportingService.formatPercentage(comparison.revenueChangePercent)}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Amount: {advancedReportingService.formatCurrency(comparison.revenueChange)}
                </p>
              </div>

              {/* Expense */}
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-gray-700 font-semibold mb-2">Expense Change</p>
                <p className="text-2xl font-bold text-orange-600">
                  {advancedReportingService.formatPercentage(comparison.expenseChangePercent)}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Amount: {advancedReportingService.formatCurrency(comparison.expenseChange)}
                </p>
              </div>

              {/* Profit */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-gray-700 font-semibold mb-2">Profit Change</p>
                <p className="text-2xl font-bold text-green-600">
                  {advancedReportingService.formatPercentage(comparison.profitChangePercent)}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Amount: {advancedReportingService.formatCurrency(comparison.profitChange)}
                </p>
              </div>

              {/* Cash Flow */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-gray-700 font-semibold mb-2">Cash Flow Change</p>
                <p className="text-2xl font-bold text-purple-600">
                  {advancedReportingService.formatPercentage(comparison.cashFlowChangePercent)}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Amount: {advancedReportingService.formatCurrency(comparison.cashFlowChange)}
                </p>
              </div>
            </div>

            {/* Insights */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Key Insights</h4>
              <ul className="space-y-2">
                {comparison.insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start text-gray-700">
                    <span className="text-blue-500 mr-2 mt-1">▸</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Budget Analysis Tab */}
        {activeTab === 'budget' && budget && !loading && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Budget vs Actual</h3>

            <div className="mb-6 p-4 rounded-lg" style={{
              backgroundColor:
                budget.varianceStatus === 'Favorable' ? '#f0fdf4' : budget.varianceStatus === 'Unfavorable' ? '#fef2f2' : '#f9fafb',
              border:
                budget.varianceStatus === 'Favorable'
                  ? '2px solid #22c55e'
                  : budget.varianceStatus === 'Unfavorable'
                    ? '2px solid #ef4444'
                    : '2px solid #9ca3af',
            }}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-900">Overall Variance</span>
                <span
                  className="text-xl font-bold"
                  style={{
                    color:
                      budget.varianceStatus === 'Favorable'
                        ? '#22c55e'
                        : budget.varianceStatus === 'Unfavorable'
                          ? '#ef4444'
                          : '#6b7280',
                  }}
                >
                  {budget.varianceStatus}
                </span>
              </div>
              <p className="text-2xl font-bold">
                {advancedReportingService.formatPercentage(budget.variancePercent)}
              </p>
            </div>

            {/* Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Budgeted Amount</p>
                <p className="text-xl font-bold text-blue-600">
                  {advancedReportingService.formatCurrency(budget.budgetedAmount)}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Actual Amount</p>
                <p className="text-xl font-bold text-green-600">
                  {advancedReportingService.formatCurrency(budget.actualAmount)}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Variance</p>
                <p
                  className="text-xl font-bold"
                  style={{
                    color: budget.variance > 0 ? '#22c55e' : '#ef4444',
                  }}
                >
                  {advancedReportingService.formatCurrency(budget.variance)}
                </p>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
              <ul className="space-y-2">
                {budget.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start text-gray-700">
                    <span className="text-yellow-500 mr-2 mt-1">★</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Scenario Planning Tab */}
        {activeTab === 'scenario' && !loading && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Scenario Planning</h3>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <label className="block text-gray-700 font-semibold mb-2">Growth Assumption %</label>
              <input
                type="range"
                min="-50"
                max="50"
                value={scenarioGrowth}
                onChange={(e) => setScenarioGrowth(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600">Current: {scenarioGrowth}%</span>
                <button
                  onClick={loadScenario}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Run Scenario
                </button>
              </div>
            </div>

            {scenario && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Revenue Projection */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-gray-700 font-semibold mb-2">Revenue Impact</p>
                    <div className="mb-2">
                      <p className="text-sm text-gray-600">Baseline</p>
                      <p className="text-lg font-bold text-blue-600">
                        {advancedReportingService.formatCurrency(scenario.baselineRevenue)}
                      </p>
                    </div>
                    <div className="mb-2">
                      <p className="text-sm text-gray-600">Projected</p>
                      <p className="text-lg font-bold text-blue-700">
                        {advancedReportingService.formatCurrency(scenario.projectedRevenue)}
                      </p>
                    </div>
                    <div className="border-t pt-2">
                      <p className="text-sm text-gray-600">Difference</p>
                      <p
                        className="text-lg font-bold"
                        style={{
                          color: scenario.revenueDifference > 0 ? '#22c55e' : '#ef4444',
                        }}
                      >
                        {advancedReportingService.formatCurrency(scenario.revenueDifference)}
                      </p>
                    </div>
                  </div>

                  {/* Profit Projection */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-gray-700 font-semibold mb-2">Profit Impact</p>
                    <div className="mb-2">
                      <p className="text-sm text-gray-600">Baseline</p>
                      <p className="text-lg font-bold text-green-600">
                        {advancedReportingService.formatCurrency(scenario.baselineProfit)}
                      </p>
                    </div>
                    <div className="mb-2">
                      <p className="text-sm text-gray-600">Projected</p>
                      <p className="text-lg font-bold text-green-700">
                        {advancedReportingService.formatCurrency(scenario.projectedProfit)}
                      </p>
                    </div>
                    <div className="border-t pt-2">
                      <p className="text-sm text-gray-600">Difference</p>
                      <p
                        className="text-lg font-bold"
                        style={{
                          color: scenario.profitDifference > 0 ? '#22c55e' : '#ef4444',
                        }}
                      >
                        {advancedReportingService.formatCurrency(scenario.profitDifference)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Impact & Implications */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-gray-50">
                    <p className="font-semibold text-gray-900 mb-2">Overall Impact</p>
                    <p
                      className="text-xl font-bold"
                      style={{
                        color:
                          scenario.impact === 'Positive'
                            ? '#22c55e'
                            : scenario.impact === 'Negative'
                              ? '#ef4444'
                              : '#6b7280',
                      }}
                    >
                      {scenario.impact}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50">
                    <h4 className="font-semibold text-gray-900 mb-2">Implications</h4>
                    <ul className="space-y-1">
                      {scenario.implications.slice(0, 2).map((imp, idx) => (
                        <li key={idx} className="text-sm text-gray-700">
                          • {imp}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


