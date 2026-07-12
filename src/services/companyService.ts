import { apiClient } from './apiClient';

export interface CompanySettings {
  id?: string;
  companyName: string;
  logoBase64?: string;
  logoMimeType?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  website?: string;
  gstNumber?: string;
  panNumber?: string;
  cinNumber?: string;
  tagline?: string;
  updatedAt?: string;
}

export const companyService = {
  get: () => apiClient.get<CompanySettings>('/api/v1/settings/company'),
  save: (settings: CompanySettings) => apiClient.put<CompanySettings>('/api/v1/settings/company', settings),
};
