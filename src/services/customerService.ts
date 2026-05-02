import { apiClient } from './apiClient';

export interface Customer {
  id: string;
  branchId: string;
  name: string;
  phone: string;
  isActive: boolean;
  aadhaarEncrypted?: string;
  panEncrypted?: string;
  createdAt?: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  aadhaarEncrypted?: string;
  panEncrypted?: string;
}

export const customerService = {
  getAll: () => apiClient.get<Customer[]>('/api/v1/Customers'),
  getById: (id: string) => apiClient.get<Customer>(`/api/v1/Customers/${id}`),
  create: (customer: CreateCustomerRequest) => apiClient.post<Customer>('/api/v1/Customers', customer),
  update: (id: string, customer: Partial<CreateCustomerRequest>) => apiClient.put<Customer>(`/api/v1/Customers/${id}`, customer),
  delete: (id: string) => apiClient.delete<void>(`/api/v1/Customers/${id}`),
  
  // Alternative endpoints
  getAllAlt: () => apiClient.get<Customer[]>('/api/Customers'),
  getByIdAlt: (id: string) => apiClient.get<Customer>(`/api/Customers/${id}`),
};