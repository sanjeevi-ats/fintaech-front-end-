import { apiClient } from './apiClient';

export interface ReceiptRequest {
  loanId: string;
  customerId: string;
  installmentIds: string[];
  totalAmount: number; // In paise
  paymentMode: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  utrRef?: string;
  remarks?: string;
}

export interface ReceiptResponse {
  success: boolean;
  receiptId: string;
  receiptNumber: string;
  message: string;
}

export const receiptService = {
  // Create receipt after payment
  createReceipt: (request: ReceiptRequest) =>
    apiClient.post<ReceiptResponse>('/api/v1/Receipts', request),

  // Get receipt by ID
  getReceipt: (receiptId: string) =>
    apiClient.get<any>(`/api/v1/Receipts/${receiptId}`),

  // Get receipts by customer
  getReceiptsByCustomer: (customerId: string) =>
    apiClient.get<any[]>(`/api/v1/Receipts/customer/${customerId}`),

  // Get receipts by loan
  getReceiptsByLoan: (loanId: string) =>
    apiClient.get<any[]>(`/api/v1/Receipts/loan/${loanId}`)
};