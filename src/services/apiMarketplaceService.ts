import { apiClient } from './apiClient';

// API Integration Types
export interface ApiIntegration {
  id: string;
  name: string;
  category: string;
  base_url: string;
  status: string;
  created_at: string;
  last_health_check_at: string;
  successful_calls: number;
  failed_calls: number;
  uptime_percentage: number;
}

export interface ApiIntegrationLog {
  id: string;
  integration_id: string;
  endpoint: string;
  method: string;
  response_time_ms: number;
  success: boolean;
  http_status_code?: number;
  error_message?: string;
  call_time: string;
}

// Webhook Types
export interface WebhookSubscription {
  id: string;
  integration_id: string;
  event_type: string;
  url: string;
  status: string;
  created_at: string;
  last_triggered_at: string;
  successful_deliveries: number;
  failed_deliveries: number;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  status_code: number;
  response_time_ms: number;
  success: boolean;
  error_message?: string;
  retry_attempt: number;
  delivery_time: string;
}

// Rate Provider Types
export interface RateProviderConfiguration {
  id: string;
  name: string;
  api_url: string;
  is_primary: boolean;
  status: string;
  created_at: string;
  last_fetch_at: string;
  successful_fetches: number;
  failed_fetches: number;
  average_response_time_ms: number;
}

export interface RateProviderFetch {
  id: string;
  provider_id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  success: boolean;
  response_time_ms: number;
  fetch_time: string;
}

export interface RateProviderHealthReport {
  provider_id: string;
  provider_name: string;
  status: string;
  is_primary: boolean;
  total_fetches: number;
  successful_fetches: number;
  failed_fetches: number;
  success_rate: number;
  average_response_time_ms: number;
  last_health_check_at: string;
  latest_rates: Record<string, number>;
}

// API Marketplace Service
export const apiMarketplaceService = {
  // API Integration Methods
  async registerIntegration(
    name: string,
    category: string,
    baseUrl: string,
    apiKey: string
  ): Promise<ApiIntegration> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    return fetch(`${API_URL}/api/apimarketplace/integrations/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        category,
        base_url: baseUrl,
        api_key: apiKey,
      }),
    }).then(r => r.json());
  },

  async getAllIntegrations(): Promise<ApiIntegration[]> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    return fetch(`${API_URL}/api/apimarketplace/integrations`, {
      method: 'GET',
    }).then(r => r.json());
  },

  async getIntegrationsByCategory(category: string): Promise<ApiIntegration[]> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    return fetch(
      `${API_URL}/api/apimarketplace/integrations/category/${category}`,
      { method: 'GET' }
    ).then(r => r.json());
  },

  async updateIntegrationStatus(
    integrationId: string,
    status: string
  ): Promise<void> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    return fetch(
      `${API_URL}/api/apimarketplace/integrations/${integrationId}/status`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }
    ).then(r => r.json());
  },

  async getIntegrationLogs(
    integrationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ApiIntegrationLog[]> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    const params = new URLSearchParams({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
    return fetch(
      `${API_URL}/api/apimarketplace/integrations/${integrationId}/logs?${params}`,
      { method: 'GET' }
    ).then(r => r.json());
  },

  // Webhook Methods
  async registerWebhook(
    integrationId: string,
    eventType: string,
    url: string
  ): Promise<WebhookSubscription> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    return fetch(`${API_URL}/api/apimarketplace/webhooks/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        integration_id: integrationId,
        event_type: eventType,
        url,
      }),
    }).then(r => r.json());
  },

  async getWebhooksByEvent(eventType: string): Promise<WebhookSubscription[]> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    return fetch(
      `${API_URL}/api/apimarketplace/webhooks/event/${eventType}`,
      { method: 'GET' }
    ).then(r => r.json());
  },

  async getWebhookDeliveries(
    webhookId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WebhookDelivery[]> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    return fetch(
      `${API_URL}/api/apimarketplace/webhooks/${webhookId}/deliveries?${params}`,
      { method: 'GET' }
    ).then(r => r.json());
  },

  async getWebhookEventStats(): Promise<Record<string, number>> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    return fetch(`${API_URL}/api/apimarketplace/webhooks/stats/events`, {
      method: 'GET',
    }).then(r => r.json());
  },

  // Rate Provider Methods
  async configureRateProvider(
    name: string,
    apiUrl: string,
    apiKey: string,
    settings?: Record<string, string>
  ): Promise<RateProviderConfiguration> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    return fetch(`${API_URL}/api/apimarketplace/rate-providers/configure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        api_url: apiUrl,
        api_key: apiKey,
        settings: settings || {},
      }),
    }).then(r => r.json());
  },

  async getAllRateProviders(): Promise<RateProviderConfiguration[]> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    return fetch(`${API_URL}/api/apimarketplace/rate-providers`, {
      method: 'GET',
    }).then(r => r.json());
  },

  async setPrimaryProvider(providerId: string): Promise<void> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    return fetch(
      `${API_URL}/api/apimarketplace/rate-providers/${providerId}/primary`,
      { method: 'PUT' }
    ).then(r => r.json());
  },

  async getProviderHealth(providerId: string): Promise<RateProviderHealthReport> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    return fetch(
      `${API_URL}/api/apimarketplace/rate-providers/${providerId}/health`,
      { method: 'GET' }
    ).then(r => r.json());
  },

  // Helper functions
  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return '#22c55e'; // green
      case 'testing':
        return '#f59e0b'; // amber
      case 'inactive':
        return '#6b7280'; // gray
      case 'error':
        return '#ef4444'; // red
      default:
        return '#3b82f6'; // blue
    }
  },

  getEventTypeLabel(eventType: string): string {
    const labels: Record<string, string> = {
      RateUpdated: '💱 Rate Updated',
      LoanCreated: '📋 Loan Created',
      CollectionMade: '💰 Collection Made',
      InterestPosted: '📊 Interest Posted',
      MonthClosed: '📅 Month Closed',
      ReportGenerated: '📈 Report Generated',
    };
    return labels[eventType] || eventType;
  },

  formatSuccessRate(rate: number): string {
    if (rate >= 99) return '✅ Excellent';
    if (rate >= 95) return '✅ Good';
    if (rate >= 90) return '⚠️ Fair';
    return '❌ Poor';
  },
};

export default apiMarketplaceService;
