import { apiClient } from './apiClient';

export interface AuditLog {
  id: string;
  entityName: string;
  recordId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  userId: string;
  userName: string;
  timestamp: string;
  branchId: string;
}

export interface EntityHistory {
  entityName: string;
  recordId: string;
  changes: AuditLog[];
}

export const auditService = {
  getEntityHistory: (entityName: string, recordId: string) => 
    apiClient.get<EntityHistory>(`/api/v1/Audit/${entityName}/${recordId}`),
  
  getRecentLogs: (limit: number = 100) => 
    apiClient.get<AuditLog[]>(`/api/v1/Audit/recent?limit=${limit}`),
};