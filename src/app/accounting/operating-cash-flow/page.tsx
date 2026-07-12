'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cashFlowService, CashFlowBreakdown, CashFlowStatement } from '@/services/cashFlowService';
import { Input } from '@/components/ui/input';

export default function OperatingCashFlowPage() {
  const [statements, setStatements] = useState<CashFlowStatement[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<CashFlowStatement | null>(null);
  const [breakdown, setBreakdown] = useState<CashFlowBreakdown | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatements();
  }, []);

  const loadStatements = async () => {
    setLoading(true);
    try {
      const data = await cashFlowService.getCashFlowHistory(12);
      setStatements(data);
      if (data.length > 0) {
        const stmt = data[0];
        setSelectedStatement(stmt);
        const cfBreakdown = await cashFlowService.getOperatingCashFlow(stmt.periodId || '');
        setBreakdown(cfBreakdown);
      }
    } catch (error) {
      console.error('Error loading operating cash flow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStatement = async (stmt: CashFlowStatement) => {
    setSelectedStatement(stmt);
    const cfBreakdown = await cashFlowService.getOperatingCashFlow(stmt.periodId || '');
    setBreakdown(cfBreakdown);
  };

  const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
    });
  };

  const getFlowIndicator = (amount: number) => {
    if (amount > 0) return '↑ Inflow';
    if (amount < 0) return '↓ Outflow';
    return '→ Neutral';
  };

  const getFlowColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Operating Cash Flow</h1>
        <p className="text-gray-600">Collections vs Operating Expenses</p>
      </div>

      {/* Statement Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Period</CardTitle>
          <CardDescription>Choose a statement to analyze</CardDescription>
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
                    <span className={`font-bold ${getFlowColor(stmt.operatingCashFlow)}`}>
                      {formatCurrency(stmt.operatingCashFlow)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operating CF Details */}
      {selectedStatement && breakdown && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Operating Cash Flow Analysis</CardTitle>
              <CardDescription>
                {new Date(selectedStatement.statementDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Inflows */}
                <div className="p-6 border rounded bg-green-50">
                  <p className="text-sm text-gray-600 mb-2">Collections (Inflows)</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(breakdown.inflows)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    From customer receipts and collections
                  </p>
                </div>

                {/* Outflows */}
                <div className="p-6 border rounded bg-red-50">
                  <p className="text-sm text-gray-600 mb-2">Expenses (Outflows)</p>
                  <p className="text-3xl font-bold text-red-600">
                    {formatCurrency(breakdown.outflows)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Operating and administrative expenses
                  </p>
                </div>

                {/* Net */}
                <div className={`p-6 border rounded ${breakdown.netCF >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                  <p className="text-sm text-gray-600 mb-2">Net Operating CF</p>
                  <p className={`text-3xl font-bold ${breakdown.netCF >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {formatCurrency(breakdown.netCF)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {breakdown.netCF >= 0 ? 'Positive flow' : 'Negative flow'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Collections Efficiency</span>
                    <span className="text-sm">
                      {breakdown.inflows > 0
                        ? ((breakdown.inflows / (breakdown.inflows + breakdown.outflows)) * 100).toFixed(1)
                        : '0'}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 bg-green-600 rounded-full"
                      style={{
                        width: `${breakdown.inflows > 0
                          ? Math.min(((breakdown.inflows / (breakdown.inflows + breakdown.outflows)) * 100), 100)
                          : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Operating Efficiency</span>
                    <span className="text-sm">
                      {breakdown.inflows > 0
                        ? (((breakdown.inflows - breakdown.outflows) / breakdown.inflows) * 100).toFixed(1)
                        : '0'}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${breakdown.netCF >= 0 ? 'bg-blue-600' : 'bg-red-600'}`}
                      style={{
                        width: `${breakdown.inflows > 0
                          ? Math.min(Math.abs(((breakdown.inflows - breakdown.outflows) / breakdown.inflows) * 100), 100)
                          : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 border rounded bg-gray-50">
                  <p className="font-semibold mb-2">Summary</p>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <span className="text-gray-600">Total Collections:</span>
                      <span className="float-right font-semibold text-green-600">
                        {formatCurrency(breakdown.inflows)}
                      </span>
                    </li>
                    <li>
                      <span className="text-gray-600">Total Expenses:</span>
                      <span className="float-right font-semibold text-red-600">
                        {formatCurrency(breakdown.outflows)}
                      </span>
                    </li>
                    <li className="border-t pt-2 font-semibold">
                      <span>Net Operating Cash Flow:</span>
                      <span className={`float-right ${breakdown.netCF >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(breakdown.netCF)}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

