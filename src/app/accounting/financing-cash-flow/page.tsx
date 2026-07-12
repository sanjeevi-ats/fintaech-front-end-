'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cashFlowService, CashFlowStatement, CashFlowBreakdown } from '@/services/cashFlowService';

export default function FinancingCashFlowPage() {
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
        const cfBreakdown = await cashFlowService.getFinancingCashFlow(stmt.periodId || '');
        setBreakdown(cfBreakdown);
      }
    } catch (error) {
      console.error('Error loading financing cash flow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStatement = async (stmt: CashFlowStatement) => {
    setSelectedStatement(stmt);
    const cfBreakdown = await cashFlowService.getFinancingCashFlow(stmt.periodId || '');
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
        <h1 className="text-4xl font-bold mb-2">Financing Cash Flow</h1>
        <p className="text-gray-600">Equity contributions vs withdrawals</p>
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
                    <span className={`font-bold ${stmt.financingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(stmt.financingCashFlow)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financing CF Details */}
      {selectedStatement && breakdown && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Financing Cash Flow Analysis</CardTitle>
              <CardDescription>
                {new Date(selectedStatement.statementDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Inflows */}
                <div className="p-6 border rounded bg-green-50">
                  <p className="text-sm text-gray-600 mb-2">Capital Inflows</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(breakdown.inflows)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Equity investments and contributions
                  </p>
                </div>

                {/* Outflows */}
                <div className="p-6 border rounded bg-red-50">
                  <p className="text-sm text-gray-600 mb-2">Capital Outflows</p>
                  <p className="text-3xl font-bold text-red-600">
                    {formatCurrency(breakdown.outflows)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Equity withdrawals and distributions
                  </p>
                </div>

                {/* Net */}
                <div className={`p-6 border rounded ${breakdown.netCF >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                  <p className="text-sm text-gray-600 mb-2">Net Financing CF</p>
                  <p className={`text-3xl font-bold ${breakdown.netCF >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {formatCurrency(breakdown.netCF)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {breakdown.netCF >= 0 ? 'Capital raised' : 'Capital returned'}
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
                  <span className="font-semibold">Capital Contribution Rate</span>
                  <span className="text-sm">
                    {breakdown.inflows + breakdown.outflows > 0
                      ? ((breakdown.inflows / (breakdown.inflows + breakdown.outflows)) * 100).toFixed(1)
                      : '0'}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 bg-green-600 rounded-full"
                    style={{
                      width: `${breakdown.inflows + breakdown.outflows > 0
                        ? (breakdown.inflows / (breakdown.inflows + breakdown.outflows)) * 100
                        : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="p-4 border rounded bg-gray-50">
                <p className="font-semibold mb-2">Equity Position</p>
                <ul className="space-y-2 text-sm">
                  <li>
                    <span className="text-gray-600">Total Inflows (Contributions):</span>
                    <span className="float-right font-semibold text-green-600">
                      {formatCurrency(breakdown.inflows)}
                    </span>
                  </li>
                  <li>
                    <span className="text-gray-600">Total Outflows (Withdrawals):</span>
                    <span className="float-right font-semibold text-red-600">
                      {formatCurrency(breakdown.outflows)}
                    </span>
                  </li>
                  <li className="border-t pt-2 font-semibold">
                    <span>Net Financing Cash Flow:</span>
                    <span className={`float-right ${breakdown.netCF >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(breakdown.netCF)}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 rounded text-sm">
                <p className="font-semibold mb-2">Interpretation</p>
                {breakdown.netCF > 0 ? (
                  <p className="text-gray-700">
                    Positive financing flow indicates capital is being raised and invested in the organization.
                  </p>
                ) : (
                  <p className="text-gray-700">
                    Negative financing flow indicates capital is being distributed to owners or reduced.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

