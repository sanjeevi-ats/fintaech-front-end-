'use client';

import React, { useState, useEffect } from 'react';
import apiMarketplaceService from '@/services/apiMarketplaceService';
import type { ApiIntegration } from '@/services/apiMarketplaceService';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    baseUrl: '',
    apiKey: '',
  });

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await apiMarketplaceService.getAllIntegrations();
      if (response && Array.isArray(response)) {
        setIntegrations(response);
      }
    } catch (error) {
      setMessage(`Error loading integrations: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.category || !formData.baseUrl) {
      setMessage('Please fill all required fields');
      return;
    }

    try {
      await apiMarketplaceService.registerIntegration(
        formData.name,
        formData.category,
        formData.baseUrl,
        formData.apiKey
      );
      setMessage('Integration registered successfully');
      setFormData({ name: '', category: '', baseUrl: '', apiKey: '' });
      setShowForm(false);
      await loadIntegrations();
    } catch (error) {
      setMessage(`Error: ${error}`);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await apiMarketplaceService.updateIntegrationStatus(id, newStatus);
      setMessage('Status updated');
      await loadIntegrations();
    } catch (error) {
      setMessage(`Error: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">API Integrations</h1>
            <p className="text-gray-600 mt-2">Manage third-party integrations</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : '+ Register Integration'}
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
            <h2 className="text-xl font-bold mb-6">Register New Integration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., RBI Rate Provider"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  <option value="RateProvider">Rate Provider</option>
                  <option value="PaymentGateway">Payment Gateway</option>
                  <option value="Analytics">Analytics</option>
                  <option value="Compliance">Compliance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base URL *
                </label>
                <input
                  type="url"
                  value={formData.baseUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, baseUrl: e.target.value })
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
              onClick={handleRegister}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
            >
              Register Integration
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {integration.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Category: {integration.category}
                  </p>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{
                    backgroundColor: apiMarketplaceService.getStatusColor(
                      integration.status
                    ),
                  }}
                >
                  {integration.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className="text-gray-600">Uptime:</span>
                  <span className="font-semibold ml-2">
                    {integration.uptime_percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Successful Calls:</span>
                  <span className="font-semibold ml-2">
                    {integration.successful_calls}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Failed Calls:</span>
                  <span className="font-semibold ml-2 text-red-600">
                    {integration.failed_calls}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <select
                  value={integration.status}
                  onChange={(e) =>
                    handleStatusChange(integration.id, e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Testing">Testing</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                Last check:{' '}
                {new Date(integration.last_health_check_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {integrations.length === 0 && !loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <p className="text-blue-900 font-medium">No integrations registered yet</p>
            <p className="text-blue-800 mt-2">
              Click "Register Integration" to add your first third-party API
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

