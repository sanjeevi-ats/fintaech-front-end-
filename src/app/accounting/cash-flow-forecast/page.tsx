'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cashFlowService, CashFlowStatement, CashFlowForecast } from '@/services/cashFlowService';
import { Input } from '@/components/ui/input';

export default function CashFlowForecastPage() {
  const [statements, setStatements] = useState<CashFlowStatement[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<CashFlowStatement | null>(null);
  const [forecasts, setForecasts] = useState<CashFlowForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [monthsAhead, setMonthsAhead] = useState('3');

  useEffect(() => {
    loadStatements();
  }, []);

  const loadStatements = async () => {
    setLoading(true);
    try {
      const data = await cashFlowService.getCashFlowHistory(12);
      setStatements(data);
      if (data.length > 0) {
        setSelectedStatement(data[0]);
      }
    } catch (error) {
      console.error('Error loading statements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateForecast = async () => {
    if (!selectedStatement) return;

    setGenerating(true);
    try {
      const forecast = await cashFlowService.generateForecast(
        selectedStatement.periodId || '',
        parseInt(monthsAhead)
      );

      if (forecast) {
        setForecasts([forecast, ...forecasts]);
      }
    } catch (error) {
      console.error('Error generating forecast:', error);
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
    });
  };

  const getConfidenceColor = (level: number) => {
    if (level >= 8) return 'text-green-600 bg-green-50';
    if (level >= 6) return 'text-blue-600 bg-blue-50';
    if (level >= 4) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceLabel = (level: number) => {
    if (level >= 8) return 'Very High';
    if (level >= 6) return 'High';
    if (level >= 4) return 'Moderate';
    return 'Low';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Cash Flow Forecast</h1>
        <p className="text-gray-600">Project future cash position</p>
      </div>

      {/* Statement Selection & Forecast Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Forecast</CardTitle>
          <CardDescription>Select a period and generate projections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Period Selection */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Select Period</label>
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
                    onClick={() => setSelectedStatement(stmt)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">
                        {new Date(stmt.statementDate).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-600">
                        Balance: {formatCurrency(stmt.endingBalance)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Forecast Parameters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Months Ahead</label>
              <Input
                type="number"
                min="1"
                max="12"
                value={monthsAhead}
                onChange={(e) => setMonthsAhead(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleGenerateForecast}
                disabled={!selectedStatement || generating}
                className="w-full"
              >
                {generating ? 'Generating...' : 'Generate Forecast'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Position */}
      {selectedStatement && (
        <Card>
          <CardHeader>
            <CardTitle>Current Position</CardTitle>
            <CardDescription>
              {new Date(selectedStatement.statementDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded">
                <p className="text-sm text-gray-600">Ending Balance</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(selectedStatement.endingBalance)}
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forecasts List */}
      {forecasts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Forecasts</CardTitle>
            <CardDescription>{forecasts.length} forecasts available</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {forecasts.map((forecast) => (
                <div key={forecast.id} className="p-4 border rounded hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold">
                        Forecast until {new Date(forecast.forecastPeriod).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Generated: {new Date(forecast.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded text-sm font-semibold ${getConfidenceColor(forecast.confidenceLevel)}`}>
                      {getConfidenceLabel(forecast.confidenceLevel)} Confidence
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 border rounded bg-gray-50">
                      <p className="text-xs text-gray-600">Projected Cash Flow</p>
                      <p className={`text-lg font-bold ${forecast.projectedCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(forecast.projectedCashFlow)}
                      </p>
                    </div>
                    <div className="p-3 border rounded bg-gray-50">
                      <p className="text-xs text-gray-600">Confidence Level</p>
                      <p className="text-lg font-bold">
                        {forecast.confidenceLevel}/10
                      </p>
                    </div>
                    <div className="p-3 border rounded bg-gray-50">
                      <p className="text-xs text-gray-600">Months Covered</p>
                      <p className="text-lg font-bold">
                        {Math.round(
                          (new Date(forecast.forecastPeriod).getTime() - new Date().getTime()) /
                            (1000 * 60 * 60 * 24 * 30)
                        )}
                      </p>
                    </div>
                    <div className="p-3 border rounded bg-gray-50">
                      <p className="text-xs text-gray-600">Status</p>
                      <p className="text-lg font-bold">
                        {forecast.status === 2 ? 'Generated' : 'Draft'}
                      </p>
                    </div>
                  </div>

                  {forecast.assumptions && (
                    <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                      <p className="font-semibold mb-1">Assumptions</p>
                      <p className="text-gray-700">{forecast.assumptions}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {forecasts.length === 0 && selectedStatement && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <p className="mb-2">No forecasts generated yet</p>
              <p className="text-sm">Click "Generate Forecast" to create projections</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

