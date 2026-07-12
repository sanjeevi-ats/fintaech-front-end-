import { apiClient } from './apiClient';

export interface Customer {
  id: string;
  code?: string;  // Business code (CUS0001, etc.) - NEW
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

export interface DuplicateCheckResult {
  exists: boolean;
  customerId?: string;
  customerName?: string;
}

export const customerService = {
  getAll: () => apiClient.get<Customer[]>('/api/v1/Customers'),
  getById: (id: string) => apiClient.get<Customer>(`/api/v1/Customers/${id}`),
  
  /**
   * Get customer by business code (e.g., CUS0001)
   * NEW - Phase 4: Frontend UI Integration
   */
  getByCode: (code: string) => 
    apiClient.get<Customer>(`/api/v1/customers/by-code/${encodeURIComponent(code)}`),
  
  create: (customer: CreateCustomerRequest) => apiClient.post<Customer>('/api/v1/Customers', customer),
  update: (id: string, customer: Partial<CreateCustomerRequest>) => apiClient.put<Customer>(`/api/v1/Customers/${id}`, customer),
  delete: (id: string) => apiClient.delete<void>(`/api/v1/Customers/${id}`),
  checkDuplicate: (phone: string) => apiClient.get<DuplicateCheckResult>(`/api/v1/Customers/check-duplicate?phone=${encodeURIComponent(phone)}`),
  
  /**
   * Search customers by code or name
   * NEW - Phase 4: Client-side search
   */
  searchByCode: async (query: string): Promise<Customer[]> => {
    if (!query || query.length < 2) return [];
    
    try {
      const allCustomers = await customerService.getAll();
      const queryLower = query.toLowerCase();
      return allCustomers.filter(c => 
        (c.code?.toLowerCase().includes(queryLower)) ||
        (c.name.toLowerCase().includes(queryLower)) ||
        (c.phone.toLowerCase().includes(queryLower))
      );
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  },
  
  // Alternative endpoints
  getAllAlt: () => apiClient.get<Customer[]>('/api/Customers'),
  getByIdAlt: (id: string) => apiClient.get<Customer>(`/api/Customers/${id}`),
};