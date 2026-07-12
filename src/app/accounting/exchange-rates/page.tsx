'use client';

import React, { useState, useEffect } from 'react';
import multiCurrencyService from '@/services/multiCurrencyService';
import type {
  ExchangeRateSnapshot,
} from '@/services/multiCurrencyService';

export default function ExchangeRatesPage() {
  const [rates, setRates] = useState<Record<string, ExchangeRateSnapshot>>({});
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFrom, setSelectedFrom] = useState('INR');
  const [selectedTo, setSelectedTo] = useState('USD');
  const [newRate, setNewRate] = useState<number>(0);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const currencies = await multiCurrencyService.getSupportedCurrencies();
      setSupportedCurrencies(currencies);

      // Load current rates for common pairs
      const commonPairs = [
        ['INR', 'USD'],
        ['INR', 'EUR'],
        ['INR', 'GBP'],
        ['USD', 'EUR'],
      ];

      const ratesMap: Record<string, ExchangeRateSnapshot> = {};
      for (const [from, to] of commonPairs) {
        try {
          const rate = await multiCurrencyService.getExchangeRate(from, to);
          ratesMap[`${from}/${to}`] = rate;
        } catch (e) {
          // Rate not found, skip
        }
      }
      setRates(ratesMap);
    } catch (error) {
      setMessage(`Error loading data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRate = async () => {
    if (newRate <= 0) {
      setMessage('Rate must be positive');
      return;
    }

    try {
      setUpdating(true);
      await multiCurrencyService.updateExchangeRate(
        selectedFrom,
        selectedTo,
        newRate,
        'Manual'
      );
      setMessage(`Rate updated: ${selectedFrom}/${selectedTo} = ${newRate}`);
      setNewRate(0);
      await loadData();
    } catch (error) {
      setMessage(`Error updating rate: ${error}`);
    } finally {
      setUpdating(false);
    }
  };

  const getRate = (from: string, to: string): number | null => {
    const key = `${from}/${to}`;
    return rates[key]?.rate ?? null;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exchange rates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Exchange Rates</h1>
          <p className="text-gray-600 mt-2">
            Manage currency exchange rates for multi-currency operations
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded ${
              message.includes('Error')
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            }`}
          >
            {message}
          </div>
        )}

        {/* Current Rates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Object.entries(rates).map(([key, rate]) => (
            <div
              key={key}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="text-sm text-gray-600 mb-2">
                {rate.from_currency} → {rate.to_currency}
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {rate.rate.toFixed(4)}
              </div>
              <div className="text-xs text-gray-500">
                Updated: {new Date(rate.effective_date).toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-500">
                Source: {rate.source}
              </div>
            </div>
          ))}
        </div>

        {/* Update Rate Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Update Rate</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Currency
              </label>
              <select
                value={selectedFrom}
                onChange={(e) => setSelectedFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {supportedCurrencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Currency
              </label>
              <select
                value={selectedTo}
                onChange={(e) => setSelectedTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {supportedCurrencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exchange Rate
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={newRate || ''}
                onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)}
                placeholder="Enter rate"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleUpdateRate}
                disabled={updating || newRate <= 0}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {updating ? 'Updating...' : 'Update Rate'}
              </button>
            </div>
          </div>
        </div>

        {/* Conversion Tool */}
        <ConversionTool
          supportedCurrencies={supportedCurrencies}
          getRate={getRate}
        />

        {/* Supported Currencies */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Supported Currencies
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {supportedCurrencies.map((curr) => (
              <div
                key={curr}
                className="bg-gray-50 p-3 rounded text-center font-medium text-gray-700"
              >
                {curr}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConversionTool({
  supportedCurrencies,
  getRate,
}: {
  supportedCurrencies: string[];
  getRate: (from: string, to: string) => number | null;
}) {
  const [amount, setAmount] = useState(10000);
  const [fromCurr, setFromCurr] = useState('INR');
  const [toCurr, setToCurr] = useState('USD');
  const [result, setResult] = useState<number | null>(null);

  const handleConvert = async () => {
    try {
      const converted =
        await multiCurrencyService.convertCurrency(amount, fromCurr, toCurr);
      setResult(converted.converted_amount);
    } catch (error) {
      console.error('Conversion error:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Currency Converter
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From
          </label>
          <select
            value={fromCurr}
            onChange={(e) => setFromCurr(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {supportedCurrencies.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To
          </label>
          <select
            value={toCurr}
            onChange={(e) => setToCurr(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {supportedCurrencies.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleConvert}
        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        Convert
      </button>

      {result !== null && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-gray-600 mb-2">Result</div>
          <div className="text-2xl font-bold text-blue-600">
            {multiCurrencyService.formatAmount(result, toCurr)}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Rate: {getRate(fromCurr, toCurr)?.toFixed(4) ?? 'N/A'}
          </div>
        </div>
      )}
    </div>
  );
}

