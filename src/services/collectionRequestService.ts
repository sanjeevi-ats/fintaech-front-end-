import { apiClient } from './apiClient';

export interface CollectionRequest {
  id: string;
  branchId: string;
  requestNumber: string;
  installmentId: string;
  installment?: {
    id: string;
    no: number;
    dueDate: string;
    amount: number;
    status: string;
  };
  loanCaseId: string;
  loanCase?: {
    id: string;
    loanCode?: string;
    principal: number;
    interestAmount: number;
    totalReceivable: number;
    customerId: string;
    customer?: {
      id: string;
      customerCode?: string;
      name: string;
      phone: string;
    };
  };
  amount: number; // in paise
  paymentMode: 'Cash' | 'Upi' | 'Bank_Transfer' | string;
  utrRef: string;
  remarks: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  requestedById: string;
  requestedBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  requestedAt: string;
  approvedById?: string;
  approvedBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  approvedAt?: string;
  previousDueAmount: number; // in paise
  newDueAmount: number; // in paise
  ipAddress: string;
}

export interface CreateCollectionRequestInput {
  installmentId: string;
  amountPaid: number; // in paise
  mode: string;
  utrRef?: string;
  remarks?: string;
}

export interface CollectionRequestResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const collectionRequestService = {
  createRequest: (input: CreateCollectionRequestInput) =>
    apiClient.post<CollectionRequestResponse<CollectionRequest>>('/api/v1/CollectionRequests', input),

  getAllRequests: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return apiClient.get<{ success: boolean; data: CollectionRequest[] }>(`/api/v1/CollectionRequests${query}`);
  },

  getRequestById: (id: string) =>
    apiClient.get<{ success: boolean; data: CollectionRequest }>(`/api/v1/CollectionRequests/${id}`),

  approveRequest: (id: string) =>
    apiClient.post<CollectionRequestResponse<CollectionRequest>>(`/api/v1/CollectionRequests/${id}/approve`, {}),

  rejectRequest: (id: string) =>
    apiClient.post<CollectionRequestResponse<CollectionRequest>>(`/api/v1/CollectionRequests/${id}/reject`, {}),

  cancelRequest: (id: string) =>
    apiClient.post<CollectionRequestResponse<CollectionRequest>>(`/api/v1/CollectionRequests/${id}/cancel`, {}),
};
