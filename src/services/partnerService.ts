import { apiClient } from './apiClient';

export interface Partner {
  id: string;
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
}

export interface WithdrawalRequest {
  partnerId: string;
  amount: number;
}

export interface PartnerCapitalSummary {
  partnerId: string;
  partnerName: string;
  totalInvestment: number;
  totalProfit: number;
  totalWithdrawal: number;
  currentBalance: number;
}

export const partnerService = {
  getAll: () => apiClient.get<Partner[]>('/api/v1/Partners'),
  getById: (id: string) => apiClient.get<Partner>(`/api/v1/Partners/${id}`),
  create: (partner: PartnerRequest) => apiClient.post<Partner>('/api/v1/Partners', partner),
  update: (id: string, partner: PartnerRequest) => apiClient.put<void>(`/api/v1/Partners/${id}`, partner),
  
  // Capital Account operations
  addInvestment: (investment: InvestmentRequest) => 
    apiClient.post<void>('/api/v1/CapitalAccounts/investment', investment),
  
  recordWithdrawal: (withdrawal: WithdrawalRequest) => 
    apiClient.post<void>('/api/v1/CapitalAccounts/withdrawal', withdrawal),
  
  getCapitalSummary: (partnerId: string) => 
    apiClient.get<PartnerCapitalSummary>(`/api/v1/CapitalAccounts/summary/${partnerId}`),
};