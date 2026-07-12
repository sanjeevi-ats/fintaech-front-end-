import { apiClient } from './apiClient';
import { companySettingsService, CompanySettings, BranchSettings } from './companySettingsService';

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

export interface ReceiptGenerationOptions {
  format: 'pdf' | 'html' | 'json';
  template: 'standard' | 'detailed' | 'compact';
  includeCompanyLogo: boolean;
  includeBranchDetails: boolean;
  includeTerminalInfo: boolean;
  language: 'en' | 'hi' | 'mr';
  emailCopy: boolean;
  customerEmail?: string;
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

export class ReceiptPdfService {
  private companySettings: CompanySettings | null = null;
  private branchSettings: BranchSettings | null = null;

  /**
   * Initialize with company and branch settings
   */
  async initialize(): Promise<void> {
    try {
      [this.companySettings, this.branchSettings] = await Promise.all([
        companySettingsService.getCompanySettings(),
        companySettingsService.getBranchSettings()
      ]);
    } catch (error) {
      console.warn('Failed to initialize receipt service with settings:', error);
    }
  }

  /**
   * Get enhanced receipt details (JSON)
   */
  async getReceiptDetails(receiptId: string): Promise<EnhancedReceiptDetails> {
    return apiClient.get<EnhancedReceiptDetails>(`/api/v1/Receipts/${receiptId}/details`);
  }

  /**
   * Download single receipt with options
   */
  async downloadReceiptWithOptions(receiptId: string, options: Partial<ReceiptGenerationOptions> = {}): Promise<void> {
    const defaultOptions: ReceiptGenerationOptions = {
      format: 'pdf',
      template: 'standard',
      includeCompanyLogo: true,
      includeBranchDetails: true,
      includeTerminalInfo: false,
      language: 'en',
      emailCopy: false
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      const response = await apiClient.post<Blob>(`/api/v1/Receipts/${receiptId}/generate`, finalOptions, {
        responseType: 'blob'
      } as any);

      const extension = finalOptions.format === 'pdf' ? 'pdf' : 'html';
      downloadBlob(response as Blob, `receipt_${receiptId}.${extension}`);

      if (finalOptions.emailCopy && finalOptions.customerEmail) {
        await this.emailReceipt(receiptId, finalOptions.customerEmail, finalOptions);
      }
    } catch (error) {
      console.error('Failed to download receipt:', error);
      throw error;
    }
  }

  /**
   * Download single receipt as HTML/PDF (legacy method)
   */
  async downloadReceiptPdf(receiptId: string): Promise<void> {
    const response = await apiClient.get<Blob>(`/api/v1/Receipts/${receiptId}/pdf`, {
      responseType: 'blob'
    } as any);
    downloadBlob(response as Blob, `receipt_${receiptId}.html`);
  }

  /**
   * Download multiple receipts as HTML/PDF
   */
  async downloadReceiptsBatch(receiptIds: string[], options: Partial<ReceiptGenerationOptions> = {}): Promise<void> {
    const response = await apiClient.post<Blob>('/api/v1/Receipts/batch/generate', { 
      receiptIds,
      options 
    }, {
      responseType: 'blob'
    } as any);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = options.format === 'pdf' ? 'pdf' : 'html';
    downloadBlob(response as Blob, `receipts_batch_${timestamp}.${extension}`);
  }

  /**
   * Email receipt to customer
   */
  async emailReceipt(receiptId: string, email: string, options: Partial<ReceiptGenerationOptions> = {}): Promise<void> {
    await apiClient.post('/api/v1/Receipts/email', {
      receiptId,
      email,
      options
    });
  }

  /**
   * Generate receipt preview (without saving)
   */
  async generatePreview(receiptData: any, options: Partial<ReceiptGenerationOptions> = {}): Promise<string> {
    await this.initialize();

    const response = await apiClient.post<{ previewUrl: string }>('/api/v1/Receipts/preview', {
      receiptData,
      options,
      companySettings: this.companySettings,
      branchSettings: this.branchSettings
    });

    return response.previewUrl;
  }

  /**
   * Open receipt in new window for printing
   */
  async printReceipt(receiptId: string, options: Partial<ReceiptGenerationOptions> = {}): Promise<void> {
    const finalOptions = { ...options, format: 'html' as const };
    
    const response = await apiClient.post<Blob>(`/api/v1/Receipts/${receiptId}/generate`, finalOptions, {
      responseType: 'blob'
    } as any);
    
    const url = window.URL.createObjectURL(response as Blob);
    const printWindow = window.open(url, '_blank', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
  }

  /**
   * Get company settings for receipt generation
   */
  getCompanySettings(): CompanySettings | null {
    return this.companySettings;
  }

  /**
   * Get branch settings for receipt generation
   */
  getBranchSettings(): BranchSettings | null {
    return this.branchSettings;
  }

  /**
   * Generate multiple receipt formats at once
   */
  async downloadAllFormats(receiptId: string): Promise<void> {
    const formats: Array<ReceiptGenerationOptions['format']> = ['pdf', 'html'];
    
    await Promise.all(
      formats.map(format => 
        this.downloadReceiptWithOptions(receiptId, { format })
      )
    );
  }
}

export const receiptPdfService = new ReceiptPdfService();
