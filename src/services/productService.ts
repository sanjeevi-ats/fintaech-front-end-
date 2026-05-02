import { apiClient } from './apiClient';

export interface LoanProduct {
  id: string;
  name: string;
  code: string;
  interestRate: number;
  defaultTenureMonths: number;
  repaymentFrequency: 0 | 1 | 2 | 3; // 0: monthly, 1: weekly, 2: daily, 3: bullet
  isActive: boolean;
}

export const productService = {
  getAll: () => apiClient.get<LoanProduct[]>('/api/v1/Product/active'),
  getById: (id: string) => apiClient.get<LoanProduct>(`/api/v1/Product/${id}`),
  create: (product: Omit<LoanProduct, 'id'>) => apiClient.post<LoanProduct>('/api/v1/Product', product),
  deactivate: (id: string) => apiClient.delete<void>(`/api/v1/Product/${id}`),
};
