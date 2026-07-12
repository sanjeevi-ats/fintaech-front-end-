'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cashFlowService, CashFlowStatement, CashFlowTrends } from '@/services/cashFlowService';
import { Input } from '@/components/ui/input';

export default function CashFlowTrendsPage() {
  const [statements, setStatements] = useState<CashFlowStatement[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<CashFlowStatement | null>(null);
  const [trends, setTrends] = useState<CashFlowTrends | null>(null);
  const [loading, setLoading] = useState(false);
  const [monthsHistory, setMonthsHistory] = useState('12');

  useEffect(() => {
    loadStatements();
  }, []);

  const loadStatements = async () => {
    setLoading(true);
    try {
      const data = await cashFlowService.getCashFlowHistory(parseInt(monthsHistory));
      setStatements(data);
      if (data.length > 0) {
        const stmt = data[0];
        setSelectedStatement(stmt);
        const trendData = await cashFlowService.getCashFlowTrends(stmt.periodId || '', parseInt(monthsHistory));
        setTrends(trendData);
      }
    } catch (error) {
      console.error('Error loading trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStatement = async (stmt: CashFlowStatement) => {
    setSelectedStatement(stmt);
    const trendData = await cashFlowService.getCashFlowTrends(stmt.periodId || '', parseInt(monthsHistory));
    setTrends(trendData);
  };

  const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
    });
  };

  const calculateTrendDirection = (min: number, max: number) => {
    if (max > min) return 'upward';
    if (max < min) return 'downward';
    return 'stable';
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'upward':
        return 'text-green-600';
      case 'downward':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Cash Flow Trends</h1>
        <p className="text-gray-600">Analyze historical patterns and volatility</p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Period</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-semibold mb-2 block">History Months</label>
              <Input
                type="number"
                min="3"
                max="24"
                value={monthsHistory}
                onChange={(e) => setMonthsHistory(e.target.value)}
              />
            </div>
            <button
              onClick={loadStatements}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Statement Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Reference Period</CardTitle>
        </CardHeader>
        <CardContent>
          {statements.length === 0 ? (
            <p className="text-gray-500">No statements available</p>
          ) : (
            <div className="space-y-2">
              {statements.slice(0, 5).map((stmt) => (
                <div
                  key={stmt.id}
                  className={`p-3 border rounded cursor-pointer transition ${
                    selectedStatement?.id === stmt.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSelectStatement(stmt)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">
                      {new Date(stmt.statementDate).toLocaleDateString()}
                    </span>
                    <span className={`font-bold ${stmt.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(stmt.netCashFlow)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trend Analysis */}
      {selectedStatement && trends && (
        <>
          {/* Summary Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Trend Summary</CardTitle>
              <CardDescription>
                Analysis of last {monthsHistory} months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded">
                  <p className="text-sm text-gray-600 mb-2">Expected Average</p>
                  <p className={`text-2xl font-bold ${trends.expected >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(trends.expected)}
                  </p>
                </div>

                <div className="p-4 border rounded">
                  <p className="text-sm text-gray-600 mb-2">Best Month</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(trends.max)}
                  </p>
                </div>

                <div className="p-4 border rounded">
                  <p className="text-sm text-gray-600 mb-2">Worst Month</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(trends.min)}
                  </p>
                </div>

                <div className="p-4 border rounded bg-gray-50">
                  <p className="text-sm text-gray-600 mb-2">Volatility Range</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {formatCurrency(trends.range)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trend Direction */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold">Overall Trend Direction</span>
                  <span className={`text-lg font-bold capitalize ${getTrendColor(calculateTrendDirection(trends.min, trends.max))}`}>
                    {calculateTrendDirection(trends.min, trends.max) === 'upward' && '↑ Upward'}
                    {calculateTrendDirection(trends.min, trends.max) === 'downward' && '↓ Downward'}
                    {calculateTrendDirection(trends.min, trends.max) === 'stable' && '→ Stable'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {calculateTrendDirection(trends.min, trends.max) === 'upward' &&
                    'Cash flow is showing a positive trend with higher recent values.'}
                  {calculateTrendDirection(trends.min, trends.max) === 'downward' &&
                    'Cash flow is declining. Immediate attention may be needed.'}
                  {calculateTrendDirection(trends.min, trends.max) === 'stable' &&
                    'Cash flow remains relatively stable over the period.'}
                </p>
              </div>

              {/* Volatility Analysis */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold">Volatility Assessment</span>
                  <span className="text-lg font-bold">
                    {(((trends.range / Math.abs(trends.expected || 1)) * 100).toFixed(1))}%
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {(trends.range / Math.abs(trends.expected || 1)) > 1
                    ? 'High volatility: Cash flow fluctuates significantly month-to-month'
                    : (trends.range / Math.abs(trends.expected || 1)) > 0.5
                      ? 'Moderate volatility: Some fluctuation in cash flow'
                      : 'Low volatility: Cash flow is relatively consistent'}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 bg-blue-600 rounded-full"
                    style={{
                      width: `${Math.min(((trends.range / Math.abs(trends.expected || 1)) * 100) / 2, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Range Visualization */}
              <div>
                <p className="font-semibold mb-3">Cash Flow Range</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Worst: {formatCurrency(trends.min)}</span>
                    <span className="text-gray-600">Best: {formatCurrency(trends.max)}</span>
                  </div>
                  <div className="relative h-8 bg-gray-100 rounded border">
                    {/* Min marker */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-red-600"
                      style={{
                        left: `${Math.max(
                          ((trends.min - Math.min(trends.min, trends.expected, trends.max)) /
                            (Math.max(trends.min, trends.expected, trends.max) -
                              Math.min(trends.min, trends.expected, trends.max))) *
                            100,
                          0
                        )}%`,
                      }}
                    ></div>

                    {/* Average marker */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-blue-600"
                      style={{
                        left: `${Math.max(
                          ((trends.expected - Math.min(trends.min, trends.expected, trends.max)) /
                            (Math.max(trends.min, trends.expected, trends.max) -
                              Math.min(trends.min, trends.expected, trends.max))) *
                            100,
                          0
                        )}%`,
                      }}
                    ></div>

                    {/* Max marker */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-green-600"
                      style={{
                        left: `${Math.max(
                          ((trends.max - Math.min(trends.min, trends.expected, trends.max)) /
                            (Math.max(trends.min, trends.expected, trends.max) -
                              Math.min(trends.min, trends.expected, trends.max))) *
                            100,
                          0
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-600 rounded-full"></span> Minimum
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span> Average
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-600 rounded-full"></span> Maximum
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="p-4 bg-blue-50 rounded">
                <p className="font-semibold mb-2">Key Insights</p>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Expected monthly cash flow: {formatCurrency(trends.expected)}</li>
                  <li>
                    • Monthly fluctuation range: {formatCurrency(trends.min)} to{' '}
                    {formatCurrency(trends.max)}
                  </li>
                  <li>
                    • Trend:{' '}
                    {calculateTrendDirection(trends.min, trends.max) === 'upward'
                      ? 'Improving'
                      : calculateTrendDirection(trends.min, trends.max) === 'downward'
                        ? 'Deteriorating'
                        : 'Stable'}
                  </li>
                  <li>
                    • Volatility level:{' '}
                    {(trends.range / Math.abs(trends.expected || 1)) > 1
                      ? 'High'
                      : (trends.range / Math.abs(trends.expected || 1)) > 0.5
                        ? 'Moderate'
                        : 'Low'}
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

