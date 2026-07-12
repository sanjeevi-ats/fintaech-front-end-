import { apiClient } from './apiClient';

export interface LoanCase {
  id: string;
  loanCode?: string; // LN00001, LN00002, etc.
  customerCode?: string;  // Customer business code - NEW
  customerId: string;
  customerName?: string; // Make optional since it might come from join
  principal: number; // In Paise
  interestAmount: number; // In Paise
  totalReceivable: number; // In Paise
  processingFees: number; // In Paise
  status: 'draft' | 'pending_approval' | 'pending_disburse' | 'active' | 'closed' | 'npa' | 'rejected';
  createdAt?: string;
  disbursedAt?: string;
  submittedAt?: string;
  submittedBy?: string;
  submittedByName?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  documentUrls?: string;
  notes?: string;
  // Additional fields that might come from API
  financeAmount?: number;
  fileChargesAmount?: number;
  customer?: {
    id: string;
    name: string;
    phone?: string;
  };
}

export interface CreateLoanRequest {
  customerId: string;
  principal: number; // In Paise
  interestAmount: number; // In Paise
  processingFees: number; // In Paise
  documentUrls?: string;
}

export const loanService = {
  getAll: () => apiClient.get<LoanCase[]>('/api/v1/LoanCases'),
  getById: (id: string) => apiClient.get<LoanCase>(`/api/v1/LoanCases/${id}`),
  
  /**
   * Get loan case by business code (e.g., LN0001)
   * NEW - Phase 4: Frontend UI Integration
   */
  getByCode: (code: string) => 
    apiClient.get<LoanCase>(`/api/v1/loancases/by-code/${encodeURIComponent(code)}`),
  
  searchByCodeOrId: (codeOrId: string) => apiClient.get<LoanCase>(`/api/v1/LoanCases/search/${codeOrId}`),
  create: (loan: CreateLoanRequest) => apiClient.post<LoanCase>('/api/v1/LoanCases', loan),
  
  /**
   * Legacy approve endpoint (used for direct approval)
   */
  approve: (id: string) => apiClient.post<void>(`/api/v1/LoanCases/${id}/approve`, {}),
  
  /**
   * PHASE 3: Submit loan for approval
   * Changes status from DRAFT to PENDING_APPROVAL
   */
  submitLoanForApproval: async (loanId: string) => {
    return apiClient.post<void>(`/api/v1/LoanCases/${loanId}/submit-approval`, {});
  },

  /**
   * PHASE 3: Get pending loan approvals
   * Returns only loans with status PENDING_APPROVAL
   */
  getPendingApprovals: async () => {
    const allLoans = await loanService.getAll();
    return allLoans.filter(l => l.status === 'pending_approval');
  },

  /**
   * PHASE 3: Approve a loan application
   * Changes status to PENDING_DISBURSE and triggers auto-updates
   */
  approveLoan: async (loanId: string) => {
    return apiClient.post<void>(`/api/v1/LoanCases/${loanId}/approve-application`, {});
  },

  /**
   * PHASE 3: Reject a loan application
   * Changes status to REJECTED with reason
   */
  rejectLoan: async (loanId: string, reason: string) => {
    return apiClient.post<void>(`/api/v1/LoanCases/${loanId}/reject`, {
      rejectionReason: reason
    });
  },

  /**
   * PHASE 3: Get loans filtered by status
   */
  getLoansByStatus: async (status: string) => {
    const allLoans = await loanService.getAll();
    return allLoans.filter(l => l.status === status);
  },

  disburse: (id: string) => apiClient.post<void>(`/api/v1/LoanCases/${id}/disburse`, {}),
  
  /**
   * Search loans by code or customer name
   * NEW - Phase 4: Client-side search
   */
  searchByCode: async (query: string): Promise<LoanCase[]> => {
    if (!query || query.length < 2) return [];
    
    try {
      const allLoans = await loanService.getAll();
      const queryLower = query.toLowerCase();
      return allLoans.filter(l => 
        (l.loanCode?.toLowerCase().includes(queryLower)) ||
        (l.customerCode?.toLowerCase().includes(queryLower)) ||
        (l.customerName?.toLowerCase().includes(queryLower))
      );
    } catch (error) {
      console.error('Error searching loans:', error);
      return [];
    }
  },
  
  // Alternative endpoints to try if main endpoint fails
  getAllWithCustomers: () => apiClient.get<LoanCase[]>('/api/v1/LoanCases?includeCustomer=true'),
  getAllAlt: () => apiClient.get<LoanCase[]>('/api/LoanCases'), // Without v1 prefix
};

export default loanService;
