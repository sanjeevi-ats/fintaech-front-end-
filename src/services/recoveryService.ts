import { apiClient } from './apiClient';

export interface OverdueLoan {
  id: string;
  customerId: string;
  customerName: string;
  principal: number;
  totalReceivable: number;
  overdueAmount: number;
  daysPastDue: number;
  lastPaymentDate?: string;
  contactNumber?: string;
  branchId: string;
}

export interface FollowUpAction {
  id: string;
  loanId: string;
  actionType: 'call' | 'visit' | 'notice' | 'legal';
  description: string;
  scheduledDate: string;
  completedDate?: string;
  outcome?: string;
  nextAction?: string;
  userId: string;
}

export interface RecordFollowUpRequest {
  actionType: 'call' | 'visit' | 'notice' | 'legal';
  description: string;
  scheduledDate: string;
  outcome?: string;
  nextAction?: string;
}

export const recoveryService = {
  getOverdueLoans: () => apiClient.get<OverdueLoan[]>('/api/v1/Recovery/overdue'),
  
  recordFollowUp: (loanId: string, action: RecordFollowUpRequest) => 
    apiClient.post<FollowUpAction>(`/api/v1/Recovery/${loanId}/follow-up`, action),
  
  getFollowUpHistory: (loanId: string) => 
    apiClient.get<FollowUpAction[]>(`/api/v1/Recovery/${loanId}/history`),
};