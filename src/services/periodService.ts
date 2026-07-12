import { apiClient } from './apiClient';

export interface Period {
  id: string;
  periodCode: string;
  startDate: string;
  endDate: string;
  status: string;
  closedAt?: string;
  closedBy?: string;
  version: number;
}

export interface CreatePeriodRequest {
  periodCode: string;
  startDate: string;
  endDate: string;
  branchId: string;
}

const periodService = {
  async getPeriods(branchId: string): Promise<Period[]> {
    const response = await apiClient.get(`/Period?branchId=${branchId}`) as { data: Period[] };
    return response.data;
  },

  async getPeriod(periodId: string): Promise<Period> {
    const response = await apiClient.get(`/Period/${periodId}`) as { data: Period };
    return response.data;
  },

  async createPeriod(data: CreatePeriodRequest): Promise<Period> {
    const response = await apiClient.post('/Period', data) as { data: Period };
    return response.data;
  },

  async openPeriod(periodId: string): Promise<Period> {
    const response = await apiClient.post(`/Period/${periodId}/open`, {}) as { data: Period };
    return response.data;
  },

  async closePeriod(periodId: string): Promise<Period> {
    const response = await apiClient.post(`/Period/${periodId}/close`, {}) as { data: Period };
    return response.data;
  },

  async archivePeriod(periodId: string): Promise<Period> {
    const response = await apiClient.post(`/Period/${periodId}/archive`, {}) as { data: Period };
    return response.data;
  },

  async getPeriodHistory(branchId: string): Promise<Period[]> {
    const response = await apiClient.get(`/Period/history?branchId=${branchId}`) as { data: Period[] };
    return response.data;
  }
};

export default periodService;
