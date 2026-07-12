import { apiClient } from './apiClient';

export interface CloseStatusDto {
  periodId: string;
  periodCode: string;
  startDate: string;
  endDate: string;
  status: string;
  allEntriesPosted: boolean;
  closedAt?: string;
  closedBy?: string;
}

export interface ProfitLossStatement {
  periodId: string;
  periodCode: string;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}

export interface CashFlowStatement {
  periodId: string;
  periodCode: string;
  period: string;
  operatingCashIn: number;
  operatingCashOut: number;
  operatingNetCash: number;
  investingCashIn: number;
  investingCashOut: number;
  investingNetCash: number;
  financingCashIn: number;
  financingCashOut: number;
  financingNetCash: number;
  netCashChange: number;
  openingCash: number;
  closingCash: number;
}

const closeService = {
  async getCloseStatus(periodId: string): Promise<CloseStatusDto> {
    const response = await apiClient.get(`/MonthEndClose/period/${periodId}/status`) as { data: CloseStatusDto };
    return response.data;
  },

  async validateCloseReadiness(periodId: string): Promise<any> {
    const response = await apiClient.post(`/MonthEndClose/period/${periodId}/validate`, {}) as { data: any };
    return response.data;
  },

  async closePeriod(periodId: string, reason?: string): Promise<any> {
    const response = await apiClient.post(`/MonthEndClose/period/${periodId}/close`, { reason }) as { data: any };
    return response.data;
  },

  async reversePeriod(periodId: string, reason: string): Promise<any> {
    const response = await apiClient.post(`/MonthEndClose/period/${periodId}/reverse`, { reason }) as { data: any };
    return response.data;
  },

  async getProfitLoss(periodId: string): Promise<ProfitLossStatement> {
    const response = await apiClient.get(`/MonthEndClose/profit-loss/${periodId}`) as { data: ProfitLossStatement };
    return response.data;
  },

  async getCashFlow(periodId: string): Promise<CashFlowStatement> {
    const response = await apiClient.get(`/MonthEndClose/cash-flow/${periodId}`) as { data: CashFlowStatement };
    return response.data;
  },

  async exportPDF(periodId: string, type: 'pl' | 'cf'): Promise<Blob> {
    const endpoint = type === 'pl' ? 'profit-loss' : 'cash-flow';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const response = await fetch(`/api/v1/MonthEndClose/${endpoint}/${periodId}/pdf`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.blob();
  },

  async exportExcel(periodId: string, type: 'pl' | 'cf'): Promise<Blob> {
    const endpoint = type === 'pl' ? 'profit-loss' : 'cash-flow';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const response = await fetch(`/api/v1/MonthEndClose/${endpoint}/${periodId}/excel`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.blob();
  }
};

export default closeService;
