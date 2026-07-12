'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { profitLossService, RevenueSummary } from '@/services/profitLossService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function RevenueBreakdownPage() {
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [periodId, setPeriodId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const loadRevenue = async () => {
    if (!periodId) return;
    setLoading(true);
    try {
      const data = await profitLossService.getRevenue(periodId);
      setRevenue(data);
    } catch (error) {
      console.error('Error loading revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
    });
  };

  const formatPercent = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0';
  };

  const chartData = revenue
    ? [
        { name: 'Interest', value: revenue.interestRevenue / 100 },
        { name: 'Fees', value: revenue.feeRevenue / 100 },
        { name: 'Penalties', value: revenue.penaltyRevenue / 100 },
        { name: 'Other', value: revenue.otherRevenue / 100 },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Revenue Breakdown</h1>
        <p className="text-gray-600">View revenue by category</p>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Period</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Enter Period ID"
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
              className="flex-1 px-4 py-2 border rounded"
            />
            <Button onClick={loadRevenue} disabled={loading || !periodId}>
              {loading ? 'Loading...' : 'Load Revenue'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {revenue && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Interest Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(revenue.interestRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {formatPercent(revenue.interestRevenue, revenue.totalRevenue)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Fee Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(revenue.feeRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {formatPercent(revenue.feeRevenue, revenue.totalRevenue)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Penalty Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(revenue.penaltyRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {formatPercent(revenue.penaltyRevenue, revenue.totalRevenue)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Other Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(revenue.otherRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {formatPercent(revenue.otherRevenue, revenue.totalRevenue)}% of total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Total Revenue Card */}
          <Card>
            <CardHeader>
              <CardTitle>Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">
                {formatCurrency(revenue.totalRevenue)}
              </p>
            </CardContent>
          </Card>

          {/* Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `₹${(value || 0).toLocaleString()}`} />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Detailed Table */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Details</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Category</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="text-right p-2">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2">Interest Income</td>
                    <td className="text-right p-2 font-semibold">
                      {formatCurrency(revenue.interestRevenue)}
                    </td>
                    <td className="text-right p-2">
                      {formatPercent(revenue.interestRevenue, revenue.totalRevenue)}%
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Fee Income</td>
                    <td className="text-right p-2 font-semibold">
                      {formatCurrency(revenue.feeRevenue)}
                    </td>
                    <td className="text-right p-2">
                      {formatPercent(revenue.feeRevenue, revenue.totalRevenue)}%
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Penalty Income</td>
                    <td className="text-right p-2 font-semibold">
                      {formatCurrency(revenue.penaltyRevenue)}
                    </td>
                    <td className="text-right p-2">
                      {formatPercent(revenue.penaltyRevenue, revenue.totalRevenue)}%
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Other Income</td>
                    <td className="text-right p-2 font-semibold">
                      {formatCurrency(revenue.otherRevenue)}
                    </td>
                    <td className="text-right p-2">
                      {formatPercent(revenue.otherRevenue, revenue.totalRevenue)}%
                    </td>
                  </tr>
                  <tr className="bg-gray-50 font-bold">
                    <td className="p-2">Total Revenue</td>
                    <td className="text-right p-2">
                      {formatCurrency(revenue.totalRevenue)}
                    </td>
                    <td className="text-right p-2">100%</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

