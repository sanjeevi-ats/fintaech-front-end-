'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cashFlowService, CashFlowStatement, LiquidityAnalysis } from '@/services/cashFlowService';

export default function LiquidityAnalysisPage() {
  const [statements, setStatements] = useState<CashFlowStatement[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<CashFlowStatement | null>(null);
  const [analysis, setAnalysis] = useState<LiquidityAnalysis | null>(null);
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
        const liquidityAnalysis = await cashFlowService.getLiquidityAnalysis(stmt.periodId || '');
        setAnalysis(liquidityAnalysis);
      }
    } catch (error) {
      console.error('Error loading liquidity analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStatement = async (stmt: CashFlowStatement) => {
    setSelectedStatement(stmt);
    const liquidityAnalysis = await cashFlowService.getLiquidityAnalysis(stmt.periodId || '');
    setAnalysis(liquidityAnalysis);
  };

  const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
    });
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical':
        return 'bg-red-100 border-red-500 text-red-700';
      case 'High':
        return 'bg-orange-100 border-orange-500 text-orange-700';
      case 'Moderate':
        return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'Low':
        return 'bg-green-100 border-green-500 text-green-700';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-700';
    }
  };

  const getRatioStatus = (ratio: number, min: number, optimal: number) => {
    if (ratio >= optimal) return { status: 'Excellent', color: 'text-green-600' };
    if (ratio >= min) return { status: 'Good', color: 'text-blue-600' };
    return { status: 'At Risk', color: 'text-red-600' };
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Liquidity Analysis</h1>
        <p className="text-gray-600">Assess cash position and risk levels</p>
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
                    <span className="text-sm">
                      Balance: {formatCurrency(stmt.endingBalance)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liquidity Analysis */}
      {selectedStatement && analysis && (
        <>
          {/* Risk Assessment */}
          <Card className={`border-2 ${getRiskColor(analysis.risk.level)}`}>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Risk Level</span>
                  <span className="text-2xl font-bold">{analysis.risk.level}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Risk Score</span>
                  <span className="text-lg font-bold">{analysis.risk.score}/100</span>
                </div>
              </div>

              <div className="p-4 bg-white rounded border">
                <p className="font-semibold mb-2">Recommendation</p>
                <p className="text-sm">{analysis.risk.recommendation}</p>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    analysis.risk.score > 70
                      ? 'bg-red-600'
                      : analysis.risk.score > 50
                        ? 'bg-orange-600'
                        : analysis.risk.score > 25
                          ? 'bg-yellow-600'
                          : 'bg-green-600'
                  }`}
                  style={{ width: `${analysis.risk.score}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Liquidity Position */}
          <Card>
            <CardHeader>
              <CardTitle>Liquidity Position</CardTitle>
              <CardDescription>Current assets vs liabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded bg-green-50">
                  <p className="text-sm text-gray-600 mb-2">Current Assets</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(analysis.position.currentAssets)}
                  </p>
                </div>

                <div className="p-4 border rounded bg-red-50">
                  <p className="text-sm text-gray-600 mb-2">Current Liabilities</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(analysis.position.currentLiabilities)}
                  </p>
                </div>

                <div className={`p-4 border rounded ${analysis.position.ratio >= 1 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                  <p className="text-sm text-gray-600 mb-2">Current Ratio</p>
                  <p className={`text-2xl font-bold ${analysis.position.ratio >= 1 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {analysis.position.ratio.toFixed(2)}x
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coverage Ratios */}
          <Card>
            <CardHeader>
              <CardTitle>Coverage Ratios</CardTitle>
              <CardDescription>Ability to meet obligations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Operating Ratio */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold">Operating Cash Flow Ratio</span>
                  <span className={`text-lg font-bold ${getRatioStatus(analysis.ratios.operatingRatio, 0.4, 0.7).color}`}>
                    {analysis.ratios.operatingRatio.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">Operating CF / Current Liabilities</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getRatioStatus(analysis.ratios.operatingRatio, 0.4, 0.7).color}`}
                    style={{
                      width: `${Math.min((analysis.ratios.operatingRatio / 1) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {getRatioStatus(analysis.ratios.operatingRatio, 0.4, 0.7).status}
                </p>
              </div>

              {/* Cash Ratio */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold">Cash Ratio</span>
                  <span className={`text-lg font-bold ${getRatioStatus(analysis.ratios.cashRatio, 0.2, 0.5).color}`}>
                    {analysis.ratios.cashRatio.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">Cash / Current Liabilities</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getRatioStatus(analysis.ratios.cashRatio, 0.2, 0.5).color}`}
                    style={{
                      width: `${Math.min((analysis.ratios.cashRatio / 1) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {getRatioStatus(analysis.ratios.cashRatio, 0.2, 0.5).status}
                </p>
              </div>

              {/* Quick Ratio */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold">Quick Ratio (Acid Test)</span>
                  <span className={`text-lg font-bold ${getRatioStatus(analysis.ratios.quickRatio, 0.5, 1.0).color}`}>
                    {analysis.ratios.quickRatio.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">(Cash + Receivables) / Current Liabilities</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getRatioStatus(analysis.ratios.quickRatio, 0.5, 1.0).color}`}
                    style={{
                      width: `${Math.min((analysis.ratios.quickRatio / 2) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {getRatioStatus(analysis.ratios.quickRatio, 0.5, 1.0).status}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Liquidity Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Assets Breakdown</CardTitle>
              <CardDescription>Component analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analysis.breakdown).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center p-3 border rounded">
                    <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-bold">{formatCurrency(value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

