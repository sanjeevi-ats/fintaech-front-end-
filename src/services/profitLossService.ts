import { apiClient } from './apiClient';

export interface RevenueLine {
  id: string;
  category: number;
  categoryName?: string;
  amount: number;
  description?: string;
  referenceCode?: string;
}

export interface ExpenseLine {
  id: string;
  category: number;
  categoryName?: string;
  amount: number;
  description?: string;
  referenceCode?: string;
}

export interface ProfitLossStatement {
  id: string;
  periodId?: string;
  branchId?: string;
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  statementDate: string;
  status: number;
  notes?: string;
  revenueLines: RevenueLine[];
  expenseLines: ExpenseLine[];
  createdAt: string;
  updatedAt?: string;
}

export interface RevenueSummary {
  interestRevenue: number;
  feeRevenue: number;
  penaltyRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
}

export interface ExpenseSummary {
  provisionExpense: number;
  waiverExpense: number;
  operatingExpense: number;
  adminExpense: number;
  totalExpense: number;
}

export interface PLComparison {
  periodId1: string;
  periodId2: string;
  statement1: ProfitLossStatement;
  statement2: ProfitLossStatement;
  revenueChange: number;
  expenseChange: number;
  profitChange: number;
  revenueChangePercent: number;
  profitChangePercent: number;
}

class ProfitLossService {
  /**
   * Generate P&L statement for a period
   */
  async generatePLStatement(
    periodId: string,
    branchId?: string,
    notes?: string
  ): Promise<ProfitLossStatement | null> {
    try {
      const response = await apiClient.post<{ success: boolean; data: ProfitLossStatement }>(
        '/profitloss/generate',
        {
          periodId,
          branchId,
          notes,
        }
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error generating P&L statement:', error);
      return null;
    }
  }

  /**
   * Get P&L statement for a period
   */
  async getPLStatement(periodId: string): Promise<ProfitLossStatement | null> {
    try {
      const response = await apiClient.get<{ success: boolean; data: ProfitLossStatement }>(
        `/profitloss/statement/${periodId}`
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error fetching P&L statement:', error);
      return null;
    }
  }

  /**
   * Get revenue breakdown for a period
   */
  async getRevenue(periodId: string): Promise<RevenueSummary | null> {
    try {
      const response = await apiClient.get<{ success: boolean; data: RevenueSummary }>(
        `/profitloss/revenue/${periodId}`
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error fetching revenue:', error);
      return null;
    }
  }

  /**
   * Get expense breakdown for a period
   */
  async getExpenses(periodId: string): Promise<ExpenseSummary | null> {
    try {
      const response = await apiClient.get<{ success: boolean; data: ExpenseSummary }>(
        `/profitloss/expenses/${periodId}`
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return null;
    }
  }

  /**
   * Get P&L history for last N months
   */
  async getHistory(months: number = 12): Promise<ProfitLossStatement[]> {
    try {
      const response = await apiClient.get<{ success: boolean; data: ProfitLossStatement[] }>(
        `/profitloss/history?months=${months}`
      );
      return (response as any)?.data || response || [];
    } catch (error) {
      console.error('Error fetching P&L history:', error);
      return [];
    }
  }

  /**
   * Calculate P&L totals for a period
   */
  async calculatePL(
    periodId: string
  ): Promise<{ totalRevenue: number; totalExpenses: number; netProfit: number; profitMargin: number } | null> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          totalRevenue: number;
          totalExpenses: number;
          netProfit: number;
          profitMargin: number;
        };
      }>(`/profitloss/calculate/${periodId}`);
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error calculating P&L:', error);
      return null;
    }
  }

  /**
   * Compare P&L statements between two periods
   */
  async comparePeriods(
    period1Id: string,
    period2Id: string
  ): Promise<ProfitLossStatement[] | null> {
    try {
      const response = await apiClient.get<{ success: boolean; data: ProfitLossStatement[] }>(
        `/profitloss/comparison?period1Id=${period1Id}&period2Id=${period2Id}`
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error comparing periods:', error);
      return null;
    }
  }

  /**
   * Get P&L statements for all branches in a period
   */
  async getBranchWiseAnalysis(periodId: string): Promise<any[] | null> {
    try {
      const response = await apiClient.get<{ success: boolean; data: any[] }>(
        `/profitloss/branch-wise/${periodId}`
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error fetching branch-wise P&L:', error);
      return null;
    }
  }

  /**
   * Get Year-to-Date P&L analysis
   */
  async getYTDAnalysis(year: number): Promise<ProfitLossStatement[] | null> {
    try {
      const response = await apiClient.get<{ success: boolean; data: ProfitLossStatement[] }>(
        `/profitloss/ytd/${year}`
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error fetching YTD analysis:', error);
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
   * Get revenue category name
   */
  getRevenueCategory(category: number): string {
    const categories: { [key: number]: string } = {
      1: 'Interest Income',
      2: 'Fees',
      3: 'Penalties',
      4: 'Other',
    };
    return categories[category] || 'Unknown';
  }

  /**
   * Get expense category name
   */
  getExpenseCategory(category: number): string {
    const categories: { [key: number]: string } = {
      1: 'Provisions',
      2: 'Waivers',
      3: 'Operating',
      4: 'Administrative',
    };
    return categories[category] || 'Unknown';
  }
}

export const profitLossService = new ProfitLossService();

