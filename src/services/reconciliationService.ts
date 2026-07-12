import { apiClient } from './apiClient';

export interface BankReconciliationResult {
  bankBalance: number;
  ledgerBalance: number;
  difference: number;
  isReconciled: boolean;
  discrepancies: string[];
}

export interface LoanReconciliationResult {
  totalLoans: number;
  totalBalance: number;
  reconciled: boolean;
  issues: string[];
}

export interface CollectionReconciliationResult {
  totalCollections: number;
  cashReceived: number;
  reconciled: boolean;
  issues: string[];
}

const reconciliationService = {
  async reconcileBank(periodId: string): Promise<BankReconciliationResult> {
    const response = await apiClient.post(`/Reconciliation/bank/${periodId}`, {}) as { data: BankReconciliationResult };
    return response.data;
  },

  async reconcileLoans(periodId: string): Promise<LoanReconciliationResult> {
    const response = await apiClient.post(`/Reconciliation/loans/${periodId}`, {}) as { data: LoanReconciliationResult };
    return response.data;
  },

  async reconcileCollections(periodId: string): Promise<CollectionReconciliationResult> {
    const response = await apiClient.post(`/Reconciliation/collections/${periodId}`, {}) as { data: CollectionReconciliationResult };
    return response.data;
  },

  async getBankReconciliationDetails(periodId: string): Promise<any> {
    const response = await apiClient.get(`/Reconciliation/bank/${periodId}/details`) as { data: any };
    return response.data;
  },

  async getLoanReconciliationDetails(periodId: string): Promise<any> {
    const response = await apiClient.get(`/Reconciliation/loans/${periodId}/details`) as { data: any };
    return response.data;
  },

  async getCollectionReconciliationDetails(periodId: string): Promise<any> {
    const response = await apiClient.get(`/Reconciliation/collections/${periodId}/details`) as { data: any };
    return response.data;
  },

  async exportReconciliationReport(periodId: string, type: 'bank' | 'loans' | 'collections'): Promise<Blob> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const response = await fetch(`/api/v1/Reconciliation/${type}/${periodId}/report`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.blob();
  }
};

export default reconciliationService;
