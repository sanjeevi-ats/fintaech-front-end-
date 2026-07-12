import { apiClient } from './apiClient';

export interface LoanProduct {
  id: string;
  code: string;  // Product code is already present
  name: string;
  interestRate: number;
  defaultTenureMonths: number;
  repaymentFrequency: 0 | 1 | 2 | 3; // 0: monthly, 1: weekly, 2: daily, 3: bullet
  isActive: boolean;
}

export const productService = {
  getAll: () => apiClient.get<LoanProduct[]>('/api/v1/Product/active'),
  getById: (id: string) => apiClient.get<LoanProduct>(`/api/v1/Product/${id}`),
  
  /**
   * Get product by business code (e.g., PRO0001)
   * NEW - Phase 4: Frontend UI Integration
   */
  getByCode: (code: string) =>
    apiClient.get<LoanProduct>(`/api/v1/product/by-code/${encodeURIComponent(code)}`),
  
  create: (product: Omit<LoanProduct, 'id'>) => apiClient.post<LoanProduct>('/api/v1/Product', product),
  deactivate: (id: string) => apiClient.delete<void>(`/api/v1/Product/${id}`),
  update: (id: string, product: LoanProduct) => apiClient.put<void>(`/api/v1/Product/${id}`, product),
};
