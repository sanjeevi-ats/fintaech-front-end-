import { apiClient } from './apiClient';

export interface CashFlowStatement {
  id: string;
  periodId?: string;
  branchId?: string;
  statementDate: string;
  beginningBalance: number;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  endingBalance: number;
  status: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CashFlowForecast {
  id: string;
  periodId?: string;
  forecastPeriod: string;
  projectedCashFlow: number;
  confidenceLevel: number;
  assumptions?: string;
  status: number;
  createdAt: string;
}

export interface CashFlowBreakdown {
  inflows: number;
  outflows: number;
  netCF: number;
}

export interface LiquidityPosition {
  currentAssets: number;
  currentLiabilities: number;
  ratio: number;
}

export interface CoverageRatios {
  operatingRatio: number;
  cashRatio: number;
  quickRatio: number;
}

export interface LiquidityRisk {
  level: string;
  score: number;
  recommendation: string;
}

export interface LiquidityAnalysis {
  position: LiquidityPosition;
  ratios: CoverageRatios;
  risk: LiquidityRisk;
  breakdown: { [key: string]: number };
}

export interface CashFlowTrends {
  min: number;
  max: number;
  expected: number;
  range: number;
}

class CashFlowService {
  /**
   * Generate cash flow statement for a period
   */
  async generateCashFlowStatement(
    periodId: string,
    branchId?: string
  ): Promise<CashFlowStatement | null> {
    try {
      const response = await apiClient.post<{ success: boolean; data: CashFlowStatement }>(
        '/cashflow/generate',
        {
          periodId,
          branchId,
        }
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error generating cash flow statement:', error);
      return null;
    }
  }

  /**
   * Get cash flow statement for a period
   */
  async getCashFlowStatement(periodId: string): Promise<CashFlowStatement | null> {
    try {
      const response = await apiClient.get<{ success: boolean; data: CashFlowStatement }>(
        `/cashflow/statement/${periodId}`
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error fetching cash flow statement:', error);
      return null;
    }
  }

  /**
   * Calculate cash flow totals for a period
   */
  async calculateCashFlow(
    periodId: string
  ): Promise<{ operatingCF: number; investingCF: number; financingCF: number; netCF: number } | null> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          operatingCF: number;
          investingCF: number;
          financingCF: number;
          netCF: number;
        };
      }>(`/cashflow/calculate/${periodId}`);
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error calculating cash flow:', error);
      return null;
    }
  }

  /**
   * Get cash flow history for last N months
   */
  async getCashFlowHistory(months: number = 12): Promise<CashFlowStatement[]> {
    try {
      const response = await apiClient.get<{ success: boolean; data: CashFlowStatement[] }>(
        `/cashflow/history?months=${months}`
      );
      return (response as any)?.data || response || [];
    } catch (error) {
      console.error('Error fetching cash flow history:', error);
      return [];
    }
  }

  /**
   * Get operating cash flow breakdown
   */
  async getOperatingCashFlow(periodId: string): Promise<CashFlowBreakdown | null> {
    try {
      const response = await apiClient.get<{ success: boolean; data: CashFlowBreakdown }>(
        `/cashflow/operating/${periodId}`
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error fetching operating cash flow:', error);
      return null;
    }
  }

  /**
   * Get investing cash flow breakdown
   */
  async getInvestingCashFlow(periodId: string): Promise<CashFlowBreakdown | null> {
    try {
      const response = await apiClient.get<{ success: boolean; data: CashFlowBreakdown }>(
        `/cashflow/investing/${periodId}`
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error fetching investing cash flow:', error);
      return null;
    }
  }

  /**
   * Get financing cash flow breakdown
   */
  async getFinancingCashFlow(periodId: string): Promise<CashFlowBreakdown | null> {
    try {
      const response = await apiClient.get<{ success: boolean; data: CashFlowBreakdown }>(
        `/cashflow/financing/${periodId}`
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error fetching financing cash flow:', error);
      return null;
    }
  }

  /**
   * Generate cash flow forecast
   */
  async generateForecast(
    periodId: string,
    monthsAhead?: number,
    branchId?: string
  ): Promise<CashFlowForecast | null> {
    try {
      const response = await apiClient.post<{ success: boolean; data: CashFlowForecast }>(
        '/cashflow/forecast',
        {
          periodId,
          monthsAhead: monthsAhead || 3,
          branchId,
        }
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error generating forecast:', error);
      return null;
    }
  }

  /**
   * Get liquidity analysis for a period
   */
  async getLiquidityAnalysis(periodId: string): Promise<LiquidityAnalysis | null> {
    try {
      const response = await apiClient.get<{ success: boolean; data: LiquidityAnalysis }>(
        `/cashflow/liquidity/${periodId}`
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error fetching liquidity analysis:', error);
      return null;
    }
  }

  /**
   * Get cash flow trends
   */
  async getCashFlowTrends(periodId: string, monthsHistory?: number): Promise<CashFlowTrends | null> {
    try {
      const response = await apiClient.get<{ success: boolean; data: CashFlowTrends }>(
        `/cashflow/trends?periodId=${periodId}&monthsHistory=${monthsHistory || 12}`
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error fetching cash flow trends:', error);
      return null;
    }
  }

  /**
   * Format amount as currency (Paise to Rupees)
   */
  formatCurrency(paise: number): number {
    return paise / 100;
  }

  /**
   * Get cash flow category name
   */
  getCategoryName(category: number): string {
    const categories: { [key: number]: string } = {
      1: 'Operating',
      2: 'Investing',
      3: 'Financing',
    };
    return categories[category] || 'Unknown';
  }

  /**
   * Get risk level color
   */
  getRiskLevelColor(level: string): string {
    const colors: { [key: string]: string } = {
      Critical: 'text-red-600 bg-red-50',
      High: 'text-orange-600 bg-orange-50',
      Moderate: 'text-yellow-600 bg-yellow-50',
      Low: 'text-green-600 bg-green-50',
    };
    return colors[level] || 'text-gray-600 bg-gray-50';
  }

  /**
   * Get confidence level color
   */
  getConfidenceLevelColor(level: number): string {
    if (level >= 8) return 'text-green-600';
    if (level >= 6) return 'text-blue-600';
    if (level >= 4) return 'text-yellow-600';
    return 'text-red-600';
  }
}

export const cashFlowService = new CashFlowService();

