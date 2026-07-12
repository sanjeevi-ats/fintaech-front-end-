'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cashFlowService, CashFlowStatement } from '@/services/cashFlowService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CashFlowStatementPage() {
  const [statements, setStatements] = useState<CashFlowStatement[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<CashFlowStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [months, setMonths] = useState('12');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await cashFlowService.getCashFlowHistory(parseInt(months));
      setStatements(data);
      if (data.length > 0) {
        setSelectedStatement(data[0]);
      }
    } catch (error) {
      console.error('Error loading cash flow history:', error);
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

  const getStatusColor = (status: number) => {
    return status === 2 ? 'text-green-600' : 'text-gray-600';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Cash Flow Statements</h1>
        <p className="text-gray-600">View cash flow analysis by period</p>
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
          <CardTitle>Cash Flow Statements</CardTitle>
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
                      <p className={`text-sm font-medium ${getStatusColor(stmt.status)}`}>
                        Status: {stmt.status === 2 ? 'Generated' : 'Draft'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(stmt.netCashFlow)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Ending: {formatCurrency(stmt.endingBalance)}
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded">
                  <p className="text-sm text-gray-600">Beginning Balance</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(selectedStatement.beginningBalance)}
                  </p>
                </div>
                <div className="p-4 border rounded">
                  <p className="text-sm text-gray-600">Operating CF</p>
                  <p className={`text-lg font-bold ${selectedStatement.operatingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(selectedStatement.operatingCashFlow)}
                  </p>
                </div>
                <div className="p-4 border rounded">
                  <p className="text-sm text-gray-600">Investing CF</p>
                  <p className={`text-lg font-bold ${selectedStatement.investingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(selectedStatement.investingCashFlow)}
                  </p>
                </div>
                <div className="p-4 border rounded">
                  <p className="text-sm text-gray-600">Financing CF</p>
                  <p className={`text-lg font-bold ${selectedStatement.financingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(selectedStatement.financingCashFlow)}
                  </p>
                </div>
                <div className="p-4 border rounded bg-blue-50">
                  <p className="text-sm text-gray-600">Net Cash Flow</p>
                  <p className={`text-lg font-bold ${selectedStatement.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(selectedStatement.netCashFlow)}
                  </p>
                </div>
                <div className="p-4 border rounded bg-blue-50">
                  <p className="text-sm text-gray-600">Ending Balance</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(selectedStatement.endingBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cash Flow Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Analysis</CardTitle>
              <CardDescription>Break down by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Operating Cash Flow</span>
                    <span className={`text-lg font-bold ${selectedStatement.operatingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(selectedStatement.operatingCashFlow)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${selectedStatement.operatingCashFlow >= 0 ? 'bg-green-600' : 'bg-red-600'}`}
                      style={{
                        width: `${Math.min(
                          (Math.abs(selectedStatement.operatingCashFlow) / Math.max(
                            Math.abs(selectedStatement.netCashFlow),
                            1
                          )) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 border rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Investing Cash Flow</span>
                    <span className={`text-lg font-bold ${selectedStatement.investingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(selectedStatement.investingCashFlow)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${selectedStatement.investingCashFlow >= 0 ? 'bg-green-600' : 'bg-red-600'}`}
                      style={{
                        width: `${Math.min(
                          (Math.abs(selectedStatement.investingCashFlow) / Math.max(
                            Math.abs(selectedStatement.netCashFlow),
                            1
                          )) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 border rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Financing Cash Flow</span>
                    <span className={`text-lg font-bold ${selectedStatement.financingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(selectedStatement.financingCashFlow)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${selectedStatement.financingCashFlow >= 0 ? 'bg-green-600' : 'bg-red-600'}`}
                      style={{
                        width: `${Math.min(
                          (Math.abs(selectedStatement.financingCashFlow) / Math.max(
                            Math.abs(selectedStatement.netCashFlow),
                            1
                          )) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

