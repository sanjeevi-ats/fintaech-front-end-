import { apiClient } from './apiClient';

export interface Installment {
  id: string;
  loanCaseId: string;
  branchId: string;
  no: number;
  dueDate: string;
  amount: number; // In Paise
  status: 'pending' | 'partially_paid' | 'paid';
  paidAmount?: number;
  paidDate?: string;
}

export interface Receipt {
  id: string;
  installmentId: string;
  amountPaid: number;
  mode: 'cash' | 'upi' | 'bank_transfer';
  utrRef?: string;
  capturedAt: string;
}

export interface RecordPaymentRequest {
  installmentId: string;
  amountPaid: number;
  mode: 'cash' | 'upi' | 'bank_transfer';
  utrRef?: string;
}

export const installmentService = {
  generateInstallments: (loanId: string) => 
    apiClient.post<Installment[]>(`/api/v1/Installments/generate/${loanId}`, {}),
  
  getDueInstallments: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const query = params.toString();
    return apiClient.get<Installment[]>(`/api/v1/Installments/due${query ? `?${query}` : ''}`);
  },
  
  getInstallmentsByLoan: (loanId: string) => 
    apiClient.get<Installment[]>(`/api/v1/Installments/loan/${loanId}`),
  
  recordPayment: (payment: RecordPaymentRequest) => 
    apiClient.post<Receipt>('/api/v1/Collection/collect', payment),
  
  getReceipts: (installmentId?: string) => {
    const params = new URLSearchParams();
    if (installmentId) params.append('installmentId', installmentId);
    const query = params.toString();
    return apiClient.get<Receipt[]>(`/api/v1/Receipts${query ? `?${query}` : ''}`);
  },
  
  syncCollections: () => apiClient.post<{ message: string }>('/api/v1/Collection/sync', {}),
};