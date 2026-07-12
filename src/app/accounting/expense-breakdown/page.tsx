'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { profitLossService, ExpenseSummary } from '@/services/profitLossService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function ExpenseBreakdownPage() {
  const [expenses, setExpenses] = useState<ExpenseSummary | null>(null);
  const [periodId, setPeriodId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const loadExpenses = async () => {
    if (!periodId) return;
    setLoading(true);
    try {
      const data = await profitLossService.getExpenses(periodId);
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
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

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16'];

  const chartData = expenses
    ? [
        { name: 'Provisions', value: expenses.provisionExpense / 100 },
        { name: 'Waivers', value: expenses.waiverExpense / 100 },
        { name: 'Operating', value: expenses.operatingExpense / 100 },
        { name: 'Admin', value: expenses.adminExpense / 100 },
      ].filter((d) => d.value > 0)
    : [];

  const pieData = expenses
    ? [
        { name: 'Provisions', value: expenses.provisionExpense },
        { name: 'Waivers', value: expenses.waiverExpense },
        { name: 'Operating', value: expenses.operatingExpense },
        { name: 'Admin', value: expenses.adminExpense },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Expense Breakdown</h1>
        <p className="text-gray-600">View expenses by category</p>
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
            <Button onClick={loadExpenses} disabled={loading || !periodId}>
              {loading ? 'Loading...' : 'Load Expenses'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {expenses && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Provisions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(expenses.provisionExpense)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {formatPercent(expenses.provisionExpense, expenses.totalExpense)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Waivers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(expenses.waiverExpense)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {formatPercent(expenses.waiverExpense, expenses.totalExpense)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Operating</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(expenses.operatingExpense)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {formatPercent(expenses.operatingExpense, expenses.totalExpense)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Administrative</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(expenses.adminExpense)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {formatPercent(expenses.adminExpense, expenses.totalExpense)}% of total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Total Expenses Card */}
          <Card>
            <CardHeader>
              <CardTitle>Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-red-600">
                {formatCurrency(expenses.totalExpense)}
              </p>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-4">
            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Expense Distribution (Bar)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => value ? `₹${Number(value).toLocaleString()}` : '₹0'} />
                      <Bar dataKey="value" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {pieData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Expense Distribution (Pie)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `₹${((value || 0) / 100).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Detailed Table */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Details</CardTitle>
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
                    <td className="p-2">Provisions</td>
                    <td className="text-right p-2 font-semibold">
                      {formatCurrency(expenses.provisionExpense)}
                    </td>
                    <td className="text-right p-2">
                      {formatPercent(expenses.provisionExpense, expenses.totalExpense)}%
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Waivers</td>
                    <td className="text-right p-2 font-semibold">
                      {formatCurrency(expenses.waiverExpense)}
                    </td>
                    <td className="text-right p-2">
                      {formatPercent(expenses.waiverExpense, expenses.totalExpense)}%
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Operating Expenses</td>
                    <td className="text-right p-2 font-semibold">
                      {formatCurrency(expenses.operatingExpense)}
                    </td>
                    <td className="text-right p-2">
                      {formatPercent(expenses.operatingExpense, expenses.totalExpense)}%
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Administrative</td>
                    <td className="text-right p-2 font-semibold">
                      {formatCurrency(expenses.adminExpense)}
                    </td>
                    <td className="text-right p-2">
                      {formatPercent(expenses.adminExpense, expenses.totalExpense)}%
                    </td>
                  </tr>
                  <tr className="bg-gray-50 font-bold">
                    <td className="p-2">Total Expenses</td>
                    <td className="text-right p-2">
                      {formatCurrency(expenses.totalExpense)}
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

