import { apiClient } from './apiClient';

export interface Partner {
  id: string;
  code?: string;  // Business code (PAR0001, etc.) - NEW
  userId: string;
  equityPct: number;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
}

export interface PartnerRequest {
  userId: string;
  equityPct: number;
}

export interface InvestmentRequest {
  partnerId: string;
  amount: number;
  paymentMode?: string;
  remarks?: string;
}

export interface WithdrawalRequest {
  partnerId: string;
  amount: number;
  paymentMode?: string;
  remarks?: string;
}

export interface PartnerCapitalSummary {
  partnerId: string;
  partnerCode?: string;  // Partner business code - NEW
  partnerName: string;
  totalInvestment: number;
  totalProfit: number;
  totalWithdrawal: number;
  currentBalance: number;
}

export const partnerService = {
  getAll: () => apiClient.get<Partner[]>('/api/v1/Partners'),
  getById: (id: string) => apiClient.get<Partner>(`/api/v1/Partners/${id}`),
  
  /**
   * Get partner by business code (e.g., PAR0001)
   * NEW - Phase 4: Frontend UI Integration
   */
  getByCode: (code: string) =>
    apiClient.get<Partner>(`/api/v1/partners/by-code/${encodeURIComponent(code)}`),
  
  create: (partner: PartnerRequest) => apiClient.post<Partner>('/api/v1/Partners', partner),
  update: (id: string, partner: PartnerRequest) => apiClient.put<void>(`/api/v1/Partners/${id}`, partner),
  
  // Capital Account operations
  addInvestment: (investment: InvestmentRequest) => 
    apiClient.post<void>('/api/v1/CapitalAccounts/investment', investment),
  
  recordWithdrawal: (withdrawal: WithdrawalRequest) => 
    apiClient.post<void>('/api/v1/CapitalAccounts/withdrawal', withdrawal),
  
  getCapitalSummary: (partnerId: string) => 
    apiClient.get<PartnerCapitalSummary>(`/api/v1/CapitalAccounts/summary/${partnerId}`),

  getAllCapitalAccounts: () =>
    apiClient.get<any[]>('/api/v1/CapitalAccounts'),

  getTransactions: (accountId: string) =>
    apiClient.get<any[]>(`/api/v1/CapitalAccounts/${accountId}/transactions`),

  getAllTransactions: () =>
    apiClient.get<any[]>('/api/v1/CapitalAccounts/transactions'),

  approveTransaction: (transactionId: string) =>
    apiClient.post<any>(`/api/v1/CapitalAccounts/transactions/${transactionId}/approve`, {}),

  rejectTransaction: (transactionId: string) =>
    apiClient.post<any>(`/api/v1/CapitalAccounts/transactions/${transactionId}/reject`, {}),

  distributeProfit: (data: { profitAmount: number; period: string }) =>
    apiClient.post<void>('/api/v1/CapitalAccounts/distribute-profit', data),
};