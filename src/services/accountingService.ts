import { apiClient } from './apiClient';

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  reference: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  branchId: string;
}

export interface TrialBalanceItem {
  accountCode: string;
  accountName: string;
  debitBalance: number;
  creditBalance: number;
}

export interface PnLItem {
  accountCode: string;
  accountName: string;
  amount: number;
  isIncome: boolean;
}

export interface PnLStatement {
  revenue: PnLItem[];
  expenses: PnLItem[];
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  period: string;
}

export const accountingService = {
  getJournalEntries: (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString();
    return apiClient.get<JournalEntry[]>(`/api/Journal/entries${query ? `?${query}` : ''}`);
  },
  
  // Alternative journal entries endpoints
  getJournalEntriesAlt: (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString();
    return apiClient.get<JournalEntry[]>(`/api/v1/Journal/entries${query ? `?${query}` : ''}`);
  },
  
  // Use correct API endpoints as specified
  getTrialBalance: (asOf?: string) => {
    const params = new URLSearchParams();
    if (asOf) params.append('asOf', asOf);
    const query = params.toString();
    return apiClient.get<TrialBalanceItem[]>(`/api/Ledger/trial-balance${query ? `?${query}` : ''}`);
  },
  
  // Alternative endpoint for trial balance
  getTrialBalanceAlt: (asOf?: string) => {
    const params = new URLSearchParams();
    if (asOf) params.append('asOf', asOf);
    const query = params.toString();
    return apiClient.get<TrialBalanceItem[]>(`/api/v1/Ledger/trial-balance${query ? `?${query}` : ''}`);
  },
  
  // Additional fallback for ledger
  getLedgerAlt: (asOf?: string) => {
    const params = new URLSearchParams();
    if (asOf) params.append('asOf', asOf);
    const query = params.toString();
    return apiClient.get<TrialBalanceItem[]>(`/api/v1/Accounting/trial-balance${query ? `?${query}` : ''}`);
  },
  
  getPnLStatement: (fromDate: string, toDate: string) => {
    const params = new URLSearchParams();
    params.append('fromDate', fromDate);
    params.append('toDate', toDate);
    return apiClient.get<PnLStatement>(`/api/Ledger/pnl?${params.toString()}`);
  },
  
  // Alternative endpoint for P&L
  getPnLStatementAlt: (fromDate: string, toDate: string) => {
    const params = new URLSearchParams();
    params.append('fromDate', fromDate);
    params.append('toDate', toDate);
    return apiClient.get<PnLStatement>(`/api/v1/Ledger/pnl?${params.toString()}`);
  },
  
  closeDayEnd: () => apiClient.post<{ message: string }>('/api/DayEnd/close', {}),
  
  // Alternative day-end endpoint
  closeDayEndAlt: () => apiClient.post<{ message: string }>('/api/v1/DayEnd/close', {}),
  
  // Additional day-end endpoints
  getDayEndBalance: () => apiClient.get<{ systemCash: number; expectedCash: number }>('/api/v1/DayEnd/balance'),
  getDayEndBalanceAlt: () => apiClient.get<{ systemCash: number; expectedCash: number }>('/api/dayend'),
};