import { apiClient } from './apiClient';

export interface DashboardStats {
  totalLoans: number;
  activeLoans: number;
  totalDisbursed: number;
  totalCollected: number;
  overdueAmount: number;
  portfolioAtRisk: number;
  collectionEfficiency: number;
  newCustomers: number;
}

export interface ParReport {
  totalPortfolio: number;
  overdueAmount: number;
  parPercentage: number;
  par30: number;
  par60: number;
  par90: number;
  reportDate: string;
}

export interface CollectionEfficiencyReport {
  totalDue: number;
  totalCollected: number;
  efficiencyPercentage: number;
  onTimeCollection: number;
  lateCollection: number;
  reportPeriod: string;
}

// Helper function to download blob as file
const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const reportService = {
  getDashboardStats: () => apiClient.get<DashboardStats>('/api/v1/Report/dashboard-stats'),
  
  getParReport: (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString();
    return apiClient.get<ParReport>(`/api/v1/Report/par${query ? `?${query}` : ''}`);
  },
  
  getCollectionEfficiency: (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString();
    return apiClient.get<CollectionEfficiencyReport>(`/api/v1/Report/efficiency${query ? `?${query}` : ''}`);
  },

  // PDF Download Methods
  downloadCustomerLoanReport: async (customerId: string) => {
    const response = await apiClient.get(`/api/v1/Report/customer/${customerId}/pdf`, {
      responseType: 'blob',
    });
    downloadBlob(response.data, `customer_loan_report_${customerId}.html`);
  },

  downloadTurnoverReport: async (startDate: string, endDate: string) => {
    const response = await apiClient.get(
      `/api/v1/Report/turnover/pdf?startDate=${startDate}&endDate=${endDate}`,
      { responseType: 'blob' }
    );
    downloadBlob(response.data, `turnover_report_${startDate}_${endDate}.html`);
  },

  downloadPnLReport: async (startDate: string, endDate: string) => {
    const response = await apiClient.get(
      `/api/v1/Report/pnl/pdf?startDate=${startDate}&endDate=${endDate}`,
      { responseType: 'blob' }
    );
    downloadBlob(response.data, `pnl_report_${startDate}_${endDate}.html`);
  },

  downloadPartnerReport: async (partnerId: string) => {
    const response = await apiClient.get(`/api/v1/Report/partner/${partnerId}/pdf`, {
      responseType: 'blob',
    });
    downloadBlob(response.data, `partner_report_${partnerId}.html`);
  },

  downloadParReport: async (startDate: string, endDate: string) => {
    const response = await apiClient.get(
      `/api/v1/Report/par/pdf?startDate=${startDate}&endDate=${endDate}`,
      { responseType: 'blob' }
    );
    downloadBlob(response.data, `par_report_${startDate}_${endDate}.html`);
  },

  downloadCollectionEfficiencyReport: async (startDate: string, endDate: string) => {
    const response = await apiClient.get(
      `/api/v1/Report/efficiency/pdf?startDate=${startDate}&endDate=${endDate}`,
      { responseType: 'blob' }
    );
    downloadBlob(response.data, `collection_efficiency_report_${startDate}_${endDate}.html`);
  },
};