import { apiClient } from './apiClient';

export interface CompanySettings {
  id: string;
  name: string;
  fullName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  phone: string;
  email: string;
  website: string;
  gstNumber: string;
  licenseNumber: string;
  registrationNumber: string;
  logo: string;
  tagline: string;
  businessType: string;
  // Receipt specific settings
  receiptPrefix: string;
  receiptFooterText: string;
  showBranchDetails: boolean;
  showTerminalDetails: boolean;
  autoEmailReceipts: boolean;
  receiptLanguage: 'en' | 'hi' | 'mr';
}

export interface BranchSettings {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  managerName: string;
  openingHours: string;
  isActive: boolean;
}

class CompanySettingsService {
  /**
   * Get company settings for receipts
   */
  async getCompanySettings(): Promise<CompanySettings> {
    try {
      const response = await apiClient.get<CompanySettings>('/api/v1/Settings/company');
      return response;
    } catch (error) {
      // Fallback to hardcoded if API fails
      return {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Vettri Finance',
        fullName: 'Vettri Finance Pvt Ltd',
        address: 'Main Road, Financial District',
        city: 'Thiruvannamalai',
        state: 'Tamil Nadu',
        country: 'India',
        pinCode: '606601',
        phone: '+91 4175 234567',
        email: 'support@vettrifinance.com',
        website: 'www.vettrifinance.com',
        gstNumber: '33AABCV9603R1ZM',
        licenseNumber: 'NBFC-MFI-TN-001/2024',
        registrationNumber: 'U65993TN2024PTC123456',
        logo: '/assets/logo.png',
        tagline: 'Empowering Financial Dreams',
        businessType: 'Microfinance Institution',
        receiptPrefix: 'RCP',
        receiptFooterText: 'Thank you for choosing Vettri Finance. For any queries, please contact our customer support.',
        showBranchDetails: true,
        showTerminalDetails: true,
        autoEmailReceipts: false,
        receiptLanguage: 'en'
      };
    }
  }

  /**
   * Get branch settings
   */
  async getBranchSettings(branchId?: string): Promise<BranchSettings> {
    try {
      const endpoint = branchId 
        ? `/api/v1/Settings/branch/${branchId}`
        : '/api/v1/Settings/branch/current';
      
      const response = await apiClient.get<BranchSettings>(endpoint);
      return response;
    } catch (error) {
      // Fallback to hardcoded if API fails
      return {
        id: '00000000-0000-0000-0000-000000000001',
        code: 'TVN-001',
        name: 'Thiruvannamalai Main Branch',
        address: 'Main Road, Financial District',
        city: 'Thiruvannamalai',
        state: 'Tamil Nadu',
        pinCode: '606601',
        phone: '+91 4175 234567',
        managerName: 'Branch Manager',
        openingHours: 'Mon-Sat: 9:00 AM - 6:00 PM',
        isActive: true
      };
    }
  }

  /**
   * Update company settings
   */
  async updateCompanySettings(settings: Partial<CompanySettings>): Promise<CompanySettings> {
    return apiClient.put<CompanySettings>('/api/v1/Settings/company', settings);
  }

  /**
   * Update branch settings
   */
  async updateBranchSettings(branchId: string, settings: Partial<BranchSettings>): Promise<BranchSettings> {
    return apiClient.put<BranchSettings>(`/api/v1/Settings/branch/${branchId}`, settings);
  }

  /**
   * Upload company logo
   */
  async uploadLogo(file: File): Promise<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    
    return apiClient.post<{ logoUrl: string }>('/api/v1/Settings/company/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    } as any);
  }

  /**
   * Get receipt templates
   */
  async getReceiptTemplates(): Promise<Array<{id: string, name: string, preview: string}>> {
    const response = await apiClient.get<Array<{id: string, name: string, preview: string}>>('/api/v1/Settings/receipt-templates');
    return response;
  }
}

export const companySettingsService = new CompanySettingsService();