import { apiClient } from './apiClient';

export interface EnhancedReceiptDetails {
  receiptNumber: string;
  generatedDate: string;
  
  // Loan Details
  loanId: string;
  loanAmount: number;
  paidAmount: number;
  remainingAmount: number;
  overdueAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  pendingInstallments: number;
  
  // Customer Details
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerId: string;
  
  // Payment Details
  collectionAmount: number;
  paymentMode: string;
  utrRef: string;
  paymentDate: string;
  remarks: string;
  
  // Company Details
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyRegistration: string;
  
  // Branch Details
  branchName: string;
  branchAddress: string;
  
  // Installment Details
  installmentDetails: InstallmentDetail[];
}

export interface InstallmentDetail {
  installmentNo: number;
  dueDate: string;
  amount: number;
  status: string;
  paidDate?: string;
  paidAmount?: number;
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

export const receiptPdfService = {
  /**
   * Get enhanced receipt details (JSON)
   */
  getReceiptDetails: (receiptId: string) => 
    apiClient.get<EnhancedReceiptDetails>(`/api/v1/Receipts/${receiptId}/details`),

  /**
   * Download single receipt as HTML/PDF
   */
  downloadReceiptPdf: async (receiptId: string) => {
    const response = await apiClient.get(`/api/v1/Receipts/${receiptId}/pdf`, {
      responseType: 'blob',
    });
    downloadBlob(response.data, `receipt_${receiptId}.html`);
  },

  /**
   * Download multiple receipts as HTML/PDF
   */
  downloadReceiptsBatch: async (receiptIds: string[]) => {
    const response = await apiClient.post('/api/v1/Receipts/batch/pdf', receiptIds, {
      responseType: 'blob',
    });
    const timestamp = new Date().toISOString().split('T')[0];
    downloadBlob(response.data, `receipts_batch_${timestamp}.html`);
  },

  /**
   * Open receipt in new window for printing
   */
  printReceipt: async (receiptId: string) => {
    const response = await apiClient.get(`/api/v1/Receipts/${receiptId}/pdf`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(response.data);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  },
};
