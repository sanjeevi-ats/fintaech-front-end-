import { apiClient } from './apiClient';

export interface LoanClosureStatus {
  loanId: string;
  currentStatus: string;
  totalInstallments: number;
  paidInstallments: number;
  pendingInstallments: number;
  totalReceivable: number;
  totalPaid: number;
  isClosureEligible: boolean;
  collectionPercentage: number;
}

export interface ManualClosureRequest {
  reason: string;
}

export const loanClosureService = {
  // Check and automatically close a loan if all installments are paid
  checkAndClose: (loanId: string) =>
    apiClient.post<{ message: string }>(`/api/LoanClosure/${loanId}/check-and-close`, {}),

  // Manually close a loan with a reason
  manualClose: (loanId: string, reason: string) =>
    apiClient.post<{ message: string; reason: string }>(`/api/LoanClosure/${loanId}/manual-close`, {
      reason
    }),

  // Verify the closure status of a loan
  verifyStatus: (loanId: string) =>
    apiClient.get<LoanClosureStatus>(`/api/LoanClosure/${loanId}/status`),

  // Batch check and close multiple loans
  batchCheckAndClose: async (loanIds: string[]) => {
    const results = [];
    for (const loanId of loanIds) {
      try {
        const result = await loanClosureService.checkAndClose(loanId);
        results.push({ loanId, success: true, result });
      } catch (error) {
        results.push({ loanId, success: false, error });
      }
    }
    return results;
  },

  // Get closure eligibility for a loan
  getClosureEligibility: async (loanId: string): Promise<boolean> => {
    try {
      const status = await loanClosureService.verifyStatus(loanId);
      return status.isClosureEligible;
    } catch (error) {
      console.error('Failed to check closure eligibility:', error);
      return false;
    }
  }
};
