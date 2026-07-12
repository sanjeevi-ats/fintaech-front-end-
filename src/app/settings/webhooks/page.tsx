'use client';

import React, { useState, useEffect } from 'react';
import apiMarketplaceService from '@/services/apiMarketplaceService';
import type { WebhookSubscription, WebhookDelivery } from '@/services/apiMarketplaceService';

const EVENT_TYPES = [
  'RateUpdated',
  'LoanCreated',
  'CollectionMade',
  'InterestPosted',
  'MonthClosed',
  'ReportGenerated',
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([]);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookSubscription | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    integrationId: '',
    eventType: '',
    url: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const statsResponse = await apiMarketplaceService.getWebhookEventStats();
      if (statsResponse) {
        setStats(statsResponse as any);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!formData.integrationId || !formData.eventType || !formData.url) {
      setMessage('Please fill all required fields');
      return;
    }

    try {
      await apiMarketplaceService.registerWebhook(
        formData.integrationId,
        formData.eventType,
        formData.url
      );
      setMessage('Webhook registered successfully');
      setFormData({ integrationId: '', eventType: '', url: '' });
      setShowForm(false);
    } catch (error) {
      setMessage(`Error: ${error}`);
    }
  };

  const handleViewDeliveries = async (webhook: WebhookSubscription) => {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 7);

      const response = await apiMarketplaceService.getWebhookDeliveries(
        webhook.id,
        startDate,
        endDate
      );
      if (response && Array.isArray(response)) {
        setDeliveries(response);
        setSelectedWebhook(webhook);
      }
    } catch (error) {
      setMessage(`Error loading deliveries: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading webhooks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Webhooks</h1>
            <p className="text-gray-600 mt-2">Manage event subscriptions and deliveries</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : '+ Register Webhook'}
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
            <h2 className="text-xl font-bold mb-6">Register New Webhook</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Integration ID *
                </label>
                <input
                  type="text"
                  value={formData.integrationId}
                  onChange={(e) =>
                    setFormData({ ...formData, integrationId: e.target.value })
                  }
                  placeholder="UUID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type *
                </label>
                <select
                  value={formData.eventType}
                  onChange={(e) =>
                    setFormData({ ...formData, eventType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select event</option>
                  {EVENT_TYPES.map((event) => (
                    <option key={event} value={event}>
                      {apiMarketplaceService.getEventTypeLabel(event)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL *
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://your-domain.com/webhook"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleRegister}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
            >
              Register Webhook
            </button>
          </div>
        )}

        {/* Event Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">Event Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(stats).map(([event, count]) => (
              <div key={event} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm text-gray-600 mb-2">
                  {apiMarketplaceService.getEventTypeLabel(event)}
                </div>
                <div className="text-2xl font-bold text-blue-600">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Deliveries Detail */}
        {selectedWebhook && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                Deliveries - {selectedWebhook.event_type}
              </h2>
              <button
                onClick={() => setSelectedWebhook(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">
                      Time
                    </th>
                    <th className="px-6 py-3 text-center font-semibold">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right font-semibold">
                      Response Time
                    </th>
                    <th className="px-6 py-3 text-center font-semibold">
                      Attempt
                    </th>
                    <th className="px-6 py-3 text-left font-semibold">
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {deliveries.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        {new Date(delivery.delivery_time).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium text-white"
                          style={{
                            backgroundColor: delivery.success
                              ? '#22c55e'
                              : '#ef4444',
                          }}
                        >
                          {delivery.success ? '✓ Success' : '✗ Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        {delivery.response_time_ms}ms
                      </td>
                      <td className="px-6 py-3 text-center">
                        {delivery.retry_attempt}
                      </td>
                      <td className="px-6 py-3 text-red-600">
                        {delivery.error_message || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {deliveries.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No deliveries in the last 7 days
              </p>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            🪝 Webhook Information
          </h3>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>Webhooks deliver events in real-time to your configured URLs</li>
            <li>Each webhook delivery is logged with response time and status</li>
            <li>Failed deliveries are retried automatically up to 5 times</li>
            <li>All payloads are signed with HMAC-SHA256 for security</li>
            <li>Monitor delivery statistics to ensure reliability</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

