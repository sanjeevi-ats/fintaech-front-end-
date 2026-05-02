import { apiClient } from './apiClient';

export interface DashboardStats {
  aum: number;
  totalLoans: number;
  activeLoans: number;
  par30: number;
  interestIncomeMTD: number;
  expensesMTD: number;
  netProfitMTD: number;
  collectedToday: number;
  aumTrend: { month: string; aum: number }[];
  branchPerformance: {
    branch: string;
    aum: number;
    loans: number;
    collection: number;
    par: number;
  }[];
}

export const dashboardService = {
  getStats: () => apiClient.get<DashboardStats>('/api/v1/Report/dashboard-stats'),
};
