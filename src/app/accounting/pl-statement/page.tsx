'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { profitLossService, ProfitLossStatement } from '@/services/profitLossService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PLStatementPage() {
  const [statements, setStatements] = useState<ProfitLossStatement[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<ProfitLossStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [months, setMonths] = useState('12');
  const router = useRouter();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await profitLossService.getHistory(parseInt(months));
      setStatements(data);
      if (data.length > 0) {
        setSelectedStatement(data[0]);
      }
    } catch (error) {
      console.error('Error loading P&L history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthsChange = (value: string) => {
    setMonths(value);
  };

  const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
    });
  };

  const formatPercent = (percent: number) => {
    return percent.toFixed(2);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">P&L Statements</h1>
        <p className="text-gray-600">View Profit & Loss statements by period</p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Select Period</CardTitle>
          <CardDescription>Choose time range to view</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <Select value={months} onValueChange={handleMonthsChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Last 3 Months</SelectItem>
                <SelectItem value="6">Last 6 Months</SelectItem>
                <SelectItem value="12">Last 12 Months</SelectItem>
                <SelectItem value="24">Last 24 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadHistory} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statement List */}
      <Card>
        <CardHeader>
          <CardTitle>P&L Statements</CardTitle>
          <CardDescription>{statements.length} statements found</CardDescription>
        </CardHeader>
        <CardContent>
          {statements.length === 0 ? (
            <p className="text-gray-500">No statements available</p>
          ) : (
            <div className="space-y-2">
              {statements.map((stmt) => (
                <div
                  key={stmt.id}
                  className={`p-4 border rounded cursor-pointer transition ${
                    selectedStatement?.id === stmt.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedStatement(stmt)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">
                        {new Date(stmt.statementDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">Status: {stmt.status === 2 ? 'Generated' : 'Draft'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(stmt.grossProfit)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Margin: {formatPercent(stmt.profitMargin)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statement Details */}
      {selectedStatement && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Statement Summary</CardTitle>
              <CardDescription>
                {new Date(selectedStatement.statementDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedStatement.totalRevenue)}
                  </p>
                </div>
                <div className="p-4 border rounded">
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(selectedStatement.totalExpenses)}
                  </p>
                </div>
                <div className="p-4 border rounded col-span-2">
                  <p className="text-sm text-gray-600">Gross Profit</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatCurrency(selectedStatement.grossProfit)}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Margin: {formatPercent(selectedStatement.profitMargin)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Breakdown */}
          {selectedStatement.revenueLines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedStatement.revenueLines.map((line) => (
                    <div key={line.id} className="flex justify-between p-2 border-b">
                      <span>{profitLossService.getRevenueCategory(line.category)}</span>
                      <span className="font-semibold">{formatCurrency(line.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expense Breakdown */}
          {selectedStatement.expenseLines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedStatement.expenseLines.map((line) => (
                    <div key={line.id} className="flex justify-between p-2 border-b">
                      <span>{profitLossService.getExpenseCategory(line.category)}</span>
                      <span className="font-semibold">{formatCurrency(line.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

