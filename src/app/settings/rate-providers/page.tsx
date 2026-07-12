'use client';

import React, { useState, useEffect } from 'react';
import apiMarketplaceService from '@/services/apiMarketplaceService';
import type { RateProviderConfiguration, RateProviderHealthReport } from '@/services/apiMarketplaceService';

export default function RateProvidersPage() {
  const [providers, setProviders] = useState<RateProviderConfiguration[]>([]);
  const [healthReport, setHealthReport] = useState<RateProviderHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    apiUrl: '',
    apiKey: '',
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await apiMarketplaceService.getAllRateProviders();
      if (response && Array.isArray(response)) {
        setProviders(response);
      }
    } catch (error) {
      setMessage(`Error loading providers: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = async () => {
    if (!formData.name || !formData.apiUrl) {
      setMessage('Please fill required fields');
      return;
    }

    try {
      await apiMarketplaceService.configureRateProvider(
        formData.name,
        formData.apiUrl,
        formData.apiKey
      );
      setMessage('Rate provider configured successfully');
      setFormData({ name: '', apiUrl: '', apiKey: '' });
      setShowForm(false);
      await loadProviders();
    } catch (error) {
      setMessage(`Error: ${error}`);
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await apiMarketplaceService.setPrimaryProvider(id);
      setMessage('Primary provider set');
      await loadProviders();
    } catch (error) {
      setMessage(`Error: ${error}`);
    }
  };

  const handleViewHealth = async (id: string) => {
    try {
      const response = await apiMarketplaceService.getProviderHealth(id);
      if (response) {
        setHealthReport(response as any);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading rate providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rate Providers</h1>
            <p className="text-gray-600 mt-2">Manage exchange rate data sources</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : '+ Configure Provider'}
          </button>
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

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold mb-6">Configure Rate Provider</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provider Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., RBI, OANDA, Bloomberg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API URL *
                </label>
                <input
                  type="url"
                  value={formData.apiUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, apiUrl: e.target.value })
                  }
                  placeholder="https://api.example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, apiKey: e.target.value })
                  }
                  placeholder="Enter API key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleConfigure}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
            >
              Configure Provider
            </button>
          </div>
        )}

        {/* Health Report */}
        {healthReport && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{healthReport.provider_name} - Health Report</h2>
              <button
                onClick={() => setHealthReport(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <div className="text-sm text-gray-600">Success Rate</div>
                <div className="text-3xl font-bold text-blue-600 mt-2">
                  {healthReport.success_rate.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {apiMarketplaceService.formatSuccessRate(healthReport.success_rate)}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded border border-green-200">
                <div className="text-sm text-gray-600">Successful Fetches</div>
                <div className="text-3xl font-bold text-green-600 mt-2">
                  {healthReport.successful_fetches}
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded border border-red-200">
                <div className="text-sm text-gray-600">Failed Fetches</div>
                <div className="text-3xl font-bold text-red-600 mt-2">
                  {healthReport.failed_fetches}
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded border border-purple-200">
                <div className="text-sm text-gray-600">Avg Response Time</div>
                <div className="text-3xl font-bold text-purple-600 mt-2">
                  {healthReport.average_response_time_ms.toFixed(0)}ms
                </div>
              </div>
            </div>

            {/* Latest Rates */}
            {Object.keys(healthReport.latest_rates).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Latest Rates</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {Object.entries(healthReport.latest_rates).map(([pair, rate]) => (
                    <div
                      key={pair}
                      className="bg-gray-50 p-3 rounded border border-gray-200 text-center"
                    >
                      <div className="text-sm font-medium text-gray-700">{pair}</div>
                      <div className="text-lg font-bold text-gray-900 mt-1">
                        {rate.toFixed(4)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className={`rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow ${
                provider.is_primary
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {provider.name}
                  </h3>
                  {provider.is_primary && (
                    <span className="text-xs font-semibold text-blue-600 mt-1">
                      ⭐ PRIMARY
                    </span>
                  )}
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{
                    backgroundColor: apiMarketplaceService.getStatusColor(
                      provider.status
                    ),
                  }}
                >
                  {provider.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-semibold ml-2">
                    {provider.successful_fetches +
                      provider.failed_fetches >
                    0
                      ? (
                          (provider.successful_fetches * 100) /
                          (provider.successful_fetches +
                            provider.failed_fetches)
                        ).toFixed(1)
                      : 'N/A'}
                    %
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Avg Response Time:</span>
                  <span className="font-semibold ml-2">
                    {provider.average_response_time_ms.toFixed(0)}ms
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Total Fetches:</span>
                  <span className="font-semibold ml-2">
                    {provider.successful_fetches +
                      provider.failed_fetches}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {!provider.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(provider.id)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  onClick={() => handleViewHealth(provider.id)}
                  className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700"
                >
                  View Health
                </button>
              </div>
            </div>
          ))}
        </div>

        {providers.length === 0 && !loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <p className="text-blue-900 font-medium">No rate providers configured</p>
            <p className="text-blue-800 mt-2">
              Click "Configure Provider" to add your first exchange rate source
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

