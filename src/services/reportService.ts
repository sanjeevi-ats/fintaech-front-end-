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

export interface TrialBalanceItem {
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
}

export interface TrialBalanceReport {
  items: TrialBalanceItem[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  asOfDate: string;
}

export interface BalanceSheetItem {
  code: string;
  name: string;
  amount: number;
}

export interface BalanceSheetSection {
  title: string;
  items: BalanceSheetItem[];
  subtotal: number;
}

export interface BalanceSheetReport {
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
  totalAssets: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  fromDate: string;
  toDate: string;
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

  // Financial Statement Methods
  getTrialBalance: async (asOfDate?: string): Promise<TrialBalanceReport> => {
    const params = new URLSearchParams();
    if (asOfDate) params.append('asOfDate', asOfDate);
    const query = params.toString();
    try {
      return await apiClient.get<TrialBalanceReport>(
        `/api/v1/FinancialStatements/trial-balance${query ? `?${query}` : ''}`
      );
    } catch (err) {
      throw new Error('Failed to fetch trial balance');
    }
  },

  getBalanceSheet: async (fromDate?: string, toDate?: string): Promise<BalanceSheetReport> => {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    const query = params.toString();
    try {
      return await apiClient.get<BalanceSheetReport>(
        `/api/v1/FinancialStatements/balance-sheet${query ? `?${query}` : ''}`
      );
    } catch (err) {
      throw new Error('Failed to fetch balance sheet');
    }
  },

  downloadTrialBalancePdf: async (asOfDate?: string): Promise<Blob> => {
    const params = new URLSearchParams();
    if (asOfDate) params.append('asOfDate', asOfDate);
    const query = params.toString();
    try {
      return await apiClient.get<Blob>(
        `/api/v1/FinancialStatements/trial-balance/pdf${query ? `?${query}` : ''}`,
        { headers: { 'Accept': 'application/pdf' } } as any
      );
    } catch (err) {
      throw new Error('Failed to download trial balance PDF');
    }
  },

  downloadBalanceSheetPdf: async (fromDate?: string, toDate?: string): Promise<Blob> => {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    const query = params.toString();
    try {
      return await apiClient.get<Blob>(
        `/api/v1/FinancialStatements/balance-sheet/pdf${query ? `?${query}` : ''}`,
        { headers: { 'Accept': 'application/pdf' } } as any
      );
    } catch (err) {
      throw new Error('Failed to download balance sheet PDF');
    }
  },

  // PDF Download Methods
  downloadCustomerLoanReport: async (customerId: string) => {
    const response = await apiClient.get<Blob>(`/api/v1/Report/customer/${customerId}/pdf`, {
      ...(({ responseType: 'blob' } as any)),
    });
    downloadBlob(response as Blob, `customer_loan_report_${customerId}.html`);
  },

  downloadTurnoverReport: async (startDate: string, endDate: string) => {
    const response = await apiClient.get<Blob>(
      `/api/v1/Report/turnover/pdf?startDate=${startDate}&endDate=${endDate}`,
      { ...(({ responseType: 'blob' } as any)) }
    );
    downloadBlob(response as Blob, `turnover_report_${startDate}_${endDate}.html`);
  },

  downloadPnLReport: async (startDate: string, endDate: string) => {
    const response = await apiClient.get<Blob>(
      `/api/v1/Report/pnl/pdf?startDate=${startDate}&endDate=${endDate}`,
      { ...(({ responseType: 'blob' } as any)) }
    );
    downloadBlob(response as Blob, `pnl_report_${startDate}_${endDate}.html`);
  },

  downloadPartnerReport: async (partnerId: string) => {
    const response = await apiClient.get<Blob>(`/api/v1/Report/partner/${partnerId}/pdf`, {
      ...(({ responseType: 'blob' } as any)),
    });
    downloadBlob(response as Blob, `partner_report_${partnerId}.html`);
  },

  downloadParReport: async (startDate: string, endDate: string) => {
    const response = await apiClient.get<Blob>(
      `/api/v1/Report/par/pdf?startDate=${startDate}&endDate=${endDate}`,
      { ...(({ responseType: 'blob' } as any)) }
    );
    downloadBlob(response as Blob, `par_report_${startDate}_${endDate}.html`);
  },

  downloadCollectionEfficiencyReport: async (startDate: string, endDate: string) => {
    const response = await apiClient.get<Blob>(
      `/api/v1/Report/efficiency/pdf?startDate=${startDate}&endDate=${endDate}`,
      { ...(({ responseType: 'blob' } as any)) }
    );
    downloadBlob(response as Blob, `collection_efficiency_report_${startDate}_${endDate}.html`);
  },
};

