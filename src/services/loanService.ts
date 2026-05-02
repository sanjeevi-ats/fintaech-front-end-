import { apiClient } from './apiClient';

export interface LoanCase {
  id: string;
  customerId: string;
  customerName?: string; // Make optional since it might come from join
  principal: number; // In Paise
  interestAmount: number; // In Paise
  totalReceivable: number; // In Paise
  processingFees: number; // In Paise
  status: 'draft' | 'pending_disburse' | 'active' | 'closed' | 'npa';
  createdAt?: string;
  disbursedAt?: string;
  // Additional fields that might come from API
  financeAmount?: number;
  fileChargesAmount?: number;
  customer?: {
    id: string;
    name: string;
    phone?: string;
  };
}

export interface CreateLoanRequest {
  customerId: string;
  principal: number; // In Paise
  interestAmount: number; // In Paise
  processingFees: number; // In Paise
}

export const loanService = {
  getAll: () => apiClient.get<LoanCase[]>('/api/v1/LoanCases'),
  getById: (id: string) => apiClient.get<LoanCase>(`/api/v1/LoanCases/${id}`),
  create: (loan: CreateLoanRequest) => apiClient.post<LoanCase>('/api/v1/LoanCases', loan),
  approve: (id: string) => apiClient.post<void>(`/api/v1/LoanCases/${id}/approve`, {}),
  disburse: (id: string) => apiClient.post<void>(`/api/v1/LoanCases/${id}/disburse`, {}),
  
  // Alternative endpoints to try if main endpoint fails
  getAllWithCustomers: () => apiClient.get<LoanCase[]>('/api/v1/LoanCases?includeCustomer=true'),
  getAllAlt: () => apiClient.get<LoanCase[]>('/api/LoanCases'), // Without v1 prefix
};
