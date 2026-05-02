import { apiClient } from './apiClient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  branchId: string;
  isActive: boolean;
}

export const userService = {
  getAll: () => apiClient.get<User[]>('/api/v1/Users'),
  getById: (id: string) => apiClient.get<User>(`/api/v1/Users/${id}`),
  create: (user: Partial<User> & { password?: string }) => apiClient.post<User>('/api/v1/Users', user),
  update: (id: string, user: Partial<User>) => apiClient.put<void>(`/api/v1/Users/${id}`, user),
  delete: (id: string) => apiClient.delete<void>(`/api/v1/Users/${id}`),
};
