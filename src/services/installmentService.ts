import { apiClient } from './apiClient';

export interface Installment {
  id: string;
  code?: string;  // Business code (INST0001, etc.) - NEW
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
  code?: string;  // Business code (RCP0001, etc.) - NEW
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
  
  /**
   * Get installment by business code (e.g., INST0001)
   * NEW - Phase 4: Frontend UI Integration
   */
  getByCode: (code: string) =>
    apiClient.get<Installment>(`/api/v1/installments/by-code/${encodeURIComponent(code)}`),
  
  recordPayment: (payment: RecordPaymentRequest) => 
    apiClient.post<Receipt>('/api/v1/Collection/collect', payment),
  
  getReceipts: (installmentId?: string) => {
    const params = new URLSearchParams();
    if (installmentId) params.append('installmentId', installmentId);
    const query = params.toString();
    return apiClient.get<Receipt[]>(`/api/v1/Receipts${query ? `?${query}` : ''}`);
  },
  
  /**
   * Get receipt by business code (e.g., RCP0001)
   * NEW - Phase 4: Frontend UI Integration
   */
  getReceiptByCode: (code: string) =>
    apiClient.get<Receipt>(`/api/v1/receipts/by-code/${encodeURIComponent(code)}`),
  
  syncCollections: () => apiClient.post<{ message: string }>('/api/v1/Collection/sync', {}),
};