'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cashFlowService, CashFlowStatement, CashFlowBreakdown } from '@/services/cashFlowService';

export default function InvestingCashFlowPage() {
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
        const cfBreakdown = await cashFlowService.getInvestingCashFlow(stmt.periodId || '');
        setBreakdown(cfBreakdown);
      }
    } catch (error) {
      console.error('Error loading investing cash flow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStatement = async (stmt: CashFlowStatement) => {
    setSelectedStatement(stmt);
    const cfBreakdown = await cashFlowService.getInvestingCashFlow(stmt.periodId || '');
    setBreakdown(cfBreakdown);
  };

  const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Investing Cash Flow</h1>
        <p className="text-gray-600">Asset sales vs purchases and investments</p>
      </div>

      {/* Statement Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Period</CardTitle>
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
                    <span className={`font-bold ${stmt.investingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(stmt.investingCashFlow)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investing CF Details */}
      {selectedStatement && breakdown && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Investing Cash Flow Analysis</CardTitle>
              <CardDescription>
                {new Date(selectedStatement.statementDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Inflows */}
                <div className="p-6 border rounded bg-green-50">
                  <p className="text-sm text-gray-600 mb-2">Asset Sales (Inflows)</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(breakdown.inflows)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    From loan repayments and asset sales
                  </p>
                </div>

                {/* Outflows */}
                <div className="p-6 border rounded bg-red-50">
                  <p className="text-sm text-gray-600 mb-2">Asset Purchases (Outflows)</p>
                  <p className="text-3xl font-bold text-red-600">
                    {formatCurrency(breakdown.outflows)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Loan disbursements and investments
                  </p>
                </div>

                {/* Net */}
                <div className={`p-6 border rounded ${breakdown.netCF >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                  <p className="text-sm text-gray-600 mb-2">Net Investing CF</p>
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
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Asset Turnover</span>
                  <span className="text-sm">
                    {breakdown.outflows > 0 ? ((breakdown.inflows / breakdown.outflows) * 100).toFixed(1) : '0'}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 bg-green-600 rounded-full"
                    style={{
                      width: `${breakdown.outflows > 0
                        ? Math.min((breakdown.inflows / breakdown.outflows) * 100, 100)
                        : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="p-4 border rounded bg-gray-50">
                <p className="font-semibold mb-2">Summary</p>
                <ul className="space-y-2 text-sm">
                  <li>
                    <span className="text-gray-600">Total Inflows (Sales/Repayments):</span>
                    <span className="float-right font-semibold text-green-600">
                      {formatCurrency(breakdown.inflows)}
                    </span>
                  </li>
                  <li>
                    <span className="text-gray-600">Total Outflows (Purchases):</span>
                    <span className="float-right font-semibold text-red-600">
                      {formatCurrency(breakdown.outflows)}
                    </span>
                  </li>
                  <li className="border-t pt-2 font-semibold">
                    <span>Net Investing Cash Flow:</span>
                    <span className={`float-right ${breakdown.netCF >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(breakdown.netCF)}
                    </span>
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

