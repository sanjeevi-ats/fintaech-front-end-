import { apiClient } from './apiClient';

/**
 * CapitalAccount domain model
 * Represents investor capital accounts with ownership tracking
 */
export interface CapitalAccount {
  id: string;
  capitalAccountCode?: string; // CAP0001, CAP0002, etc.
  partnerId: string;
  partnerCode?: string;
  partnerName?: string;
  openingBalance: number; // In Paise
  currentBalance: number; // In Paise
  ownershipPercentage: number; // 0-100
  currency: string; // INR, USD, etc.
  status: 'active' | 'inactive' | 'closed';
  createdAt?: string;
  createdBy?: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
}

/**
 * CapitalTransaction model
 * Represents individual transactions (contribution, withdrawal, distribution)
 */
export interface CapitalTransaction {
  id: string;
  capitalAccountId: string;
  transactionCode?: string; // CAT0001, CAT0002, etc.
  transactionType: 'Contribution' | 'Withdrawal' | 'Distribution';
  amount: number; // In Paise
  status: 'Pending' | 'Approved' | 'Rejected';
  transactionDate: string; // ISO date
  description?: string;
  referenceNumber?: string;
  rejectionReason?: string;
  createdAt?: string;
  createdBy?: string;
  approvedAt?: string;
  approvedBy?: string;
}

/**
 * Request model for creating a capital account
 */
export interface CreateCapitalAccountRequest {
  partnerId: string;
  openingBalance: number; // In Paise
}

/**
 * Request model for recording a transaction
 */
export interface RecordCapitalTransactionRequest {
  type: 'Contribution' | 'Withdrawal' | 'Distribution';
  amount: number; // In Paise
  transactionDate: string; // ISO date
  description?: string;
  referenceNumber?: string;
}

/**
 * Capital Account overview for investor dashboard
 */
export interface CapitalAccountOverview {
  totalCapital: number; // In Paise
  investorCount: number;
  averageOwnership: number; // %
  topInvestors: Array<{
    partnerId: string;
    partnerCode: string;
    partnerName: string;
    investment: number; // In Paise
    ownership: number; // %
  }>;
}

/**
 * Capital Account Service
 * Handles all capital account operations
 */
export const capitalAccountService = {
  /**
   * Get all capital accounts
   */
  getAll: () => apiClient.get<CapitalAccount[]>('/api/v1/CapitalAccounts'),

  /**
   * Get capital account by ID
   */
  getById: (id: string) => apiClient.get<CapitalAccount>(`/api/v1/CapitalAccounts/${id}`),

  /**
   * Get capital account by business code (CAP0001, etc.)
   */
  getByCode: (code: string) =>
    apiClient.get<CapitalAccount>(`/api/v1/CapitalAccounts/by-code/${encodeURIComponent(code)}`),

  /**
   * Create new capital account
   */
  create: (request: CreateCapitalAccountRequest) =>
    apiClient.post<CapitalAccount>('/api/v1/CapitalAccounts', request),

  /**
   * Record a capital transaction (contribution, withdrawal, distribution)
   */
  recordTransaction: (accountId: string, request: RecordCapitalTransactionRequest) =>
    apiClient.post<CapitalTransaction>(
      `/api/v1/CapitalAccounts/${accountId}/transactions`,
      request
    ),

  /**
   * Approve a pending transaction
   */
  approveTransaction: (transactionId: string) =>
    apiClient.post<CapitalTransaction>(
      `/api/v1/CapitalAccounts/transactions/${transactionId}/approve`,
      {}
    ),

  /**
   * Reject a pending transaction
   */
  rejectTransaction: (transactionId: string) =>
    apiClient.post<CapitalTransaction>(
      `/api/v1/CapitalAccounts/transactions/${transactionId}/reject`,
      {}
    ),

  /**
   * Get transactions for a specific account
   */
  getTransactions: (accountId: string) =>
    apiClient.get<CapitalTransaction[]>(`/api/v1/CapitalAccounts/${accountId}/transactions`),

  /**
   * Get a specific transaction
   */
  getTransaction: (transactionId: string) =>
    apiClient.get<CapitalTransaction>(`/api/v1/CapitalAccounts/transactions/${transactionId}`),

  /**
   * Get total capital across all accounts
   */
  getTotalCapital: () =>
    apiClient.get<{ totalCapital: number }>('/api/v1/CapitalAccounts/total-capital'),

  /**
   * Get ownership percentage for a specific account
   */
  getOwnershipPercentage: (accountId: string) =>
    apiClient.get<{ ownershipPercentage: number }>(`/api/v1/CapitalAccounts/${accountId}/ownership`),

  /**
   * Get account summary for a partner
   */
  getSummary: (partnerId: string) =>
    apiClient.get<CapitalAccount>(`/api/v1/CapitalAccounts/summary/${partnerId}`),

  /**
   * Recalculate all ownership percentages
   */
  recalculateOwnership: () =>
    apiClient.post<void>('/api/v1/CapitalAccounts/recalculate-ownership', {}),

  /**
   * Search accounts by code or partner name
   */
  searchByCode: async (query: string): Promise<CapitalAccount[]> => {
    if (!query || query.length < 2) return [];

    try {
      const allAccounts = await capitalAccountService.getAll();
      const queryLower = query.toLowerCase();
      return allAccounts.filter((a) =>
        (a.capitalAccountCode?.toLowerCase().includes(queryLower)) ||
        (a.partnerCode?.toLowerCase().includes(queryLower)) ||
        (a.partnerName?.toLowerCase().includes(queryLower))
      );
    } catch (error) {
      console.error('Error searching capital accounts:', error);
      return [];
    }
  },

  /**
   * Get pending transactions across all accounts
   */
  getPendingTransactions: async (): Promise<CapitalTransaction[]> => {
    try {
      const allAccounts = await capitalAccountService.getAll();
      const transactions: CapitalTransaction[] = [];

      for (const account of allAccounts) {
        const accountTransactions = await capitalAccountService.getTransactions(account.id);
        const pending = accountTransactions.filter((t) => t.status === 'Pending');
        transactions.push(...pending);
      }

      return transactions;
    } catch (error) {
      console.error('Error fetching pending transactions:', error);
      return [];
    }
  },

  /**
   * Get approved transactions across all accounts
   */
  getApprovedTransactions: async (): Promise<CapitalTransaction[]> => {
    try {
      const allAccounts = await capitalAccountService.getAll();
      const transactions: CapitalTransaction[] = [];

      for (const account of allAccounts) {
        const accountTransactions = await capitalAccountService.getTransactions(account.id);
        const approved = accountTransactions.filter((t) => t.status === 'Approved');
        transactions.push(...approved);
      }

      return transactions;
    } catch (error) {
      console.error('Error fetching approved transactions:', error);
      return [];
    }
  },

  /**
   * Format amount from paise to currency display
   */
  formatAmount: (paise: number): string => {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },
};

export default capitalAccountService;
