import { apiClient } from './apiClient';

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  managerId?: string;
  isActive: boolean;
  settingsJson?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BranchRequest {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  managerId?: string;
  isActive?: boolean;
  settingsJson?: string;
}

export const branchService = {
  getAll: () => apiClient.get<Branch[]>('/api/v1/Branch'),
  getById: (id: string) => apiClient.get<Branch>(`/api/v1/Branch/${id}`),
  search: (query: string) => apiClient.get<Branch[]>(`/api/v1/Branch/search?query=${encodeURIComponent(query)}`),
  create: (branch: BranchRequest) => apiClient.post<Branch>('/api/v1/Branch', branch),
  update: (id: string, branch: BranchRequest) => apiClient.put<void>(`/api/v1/Branch/${id}`, branch),
  delete: (id: string) => apiClient.delete<void>(`/api/v1/Branch/${id}`),
  updateSettings: (id: string, settingsJson: string) => 
    apiClient.put<void>(`/api/v1/Branch/${id}/settings`, settingsJson),
};