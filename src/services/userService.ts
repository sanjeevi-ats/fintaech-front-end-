import { apiClient } from './apiClient';

export interface User {
  id: string;
  code?: string;  // Business code (USR0001, etc.)
  name: string;
  email: string;
  role: string;
  branchId: string;
  isActive: boolean;
}

export const userService = {
  getAll: () => apiClient.get<User[]>('/api/v1/Users'),
  getById: (id: string) => apiClient.get<User>(`/api/v1/Users/${id}`),
  
  getByCode: (code: string) => 
    apiClient.get<User>(`/api/v1/users/by-code/${encodeURIComponent(code)}`),
  
  create: (user: Partial<User> & { password?: string }) => apiClient.post<User>('/api/v1/Users', user),
  update: (id: string, user: Partial<User>) => apiClient.put<void>(`/api/v1/Users/${id}`, user),
  delete: (id: string) => apiClient.delete<void>(`/api/v1/Users/${id}`),
  
  /** Soft-deactivate a user (sets IsActive = false) */
  deactivate: (id: string) => apiClient.patch<{ success: boolean; message: string }>(`/api/v1/Users/${id}/deactivate`, {}),
  
  /** Reactivate a user (sets IsActive = true via update) */
  reactivate: (id: string) => apiClient.put<void>(`/api/v1/Users/${id}`, { isActive: true }),

  searchByCode: async (query: string): Promise<User[]> => {
    if (!query || query.length < 2) return [];
    try {
      const allUsers = await userService.getAll();
      const queryLower = query.toLowerCase();
      return allUsers.filter(u => 
        (u.code?.toLowerCase().includes(queryLower)) ||
        (u.name.toLowerCase().includes(queryLower)) ||
        (u.email.toLowerCase().includes(queryLower))
      );
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  },
};

