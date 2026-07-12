import { apiClient } from './apiClient';

export interface ComparativeAnalysis {
  period1Id: string;
  period2Id: string;
  revenueChange: number;
  revenueChangePercent: number;
  expenseChange: number;
  expenseChangePercent: number;
  profitChange: number;
  profitChangePercent: number;
  cashFlowChange: number;
  cashFlowChangePercent: number;
  metricChanges: { [key: string]: number };
  insights: string[];
}

export interface BudgetLine {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  status: string;
}

export interface BudgetAnalysis {
  periodId: string;
  budgetedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
  varianceStatus: string;
  detailedAnalysis: { [key: string]: BudgetLine };
  recommendations: string[];
}

export interface PerformanceMetrics {
  periodId: string;
  roE: number;
  roA: number;
  profitMargin: number;
  operatingMargin: number;
  assetTurnover: number;
  debtToEquity: number;
  currentRatio: number;
  quickRatio: number;
  revenuePerEmployee: number;
  customMetrics: { [key: string]: number };
}

export interface ScenarioAnalysis {
  periodId: string;
  scenarioName: string;
  assumptions: number;
  baselineRevenue: number;
  projectedRevenue: number;
  revenueDifference: number;
  baselineProfit: number;
  projectedProfit: number;
  profitDifference: number;
  impact: string;
  implications: string[];
}

export interface CustomReport {
  id: string;
  branchId: string;
  name: string;
  queryJson: string;
  createdAt: string;
  lastRunAt?: string;
  lastResults: { [key: string]: any };
}

class AdvancedReportingService {
  /**
   * Compare financial metrics between two periods
   */
  async comparePeriodsAsync(
    period1Id: string,
    period2Id: string
  ): Promise<ComparativeAnalysis | null> {
    try {
      const response = await apiClient.post<{ success: boolean; data: ComparativeAnalysis }>(
        '/advancedreporting/compare/periods',
        {
          period1Id,
          period2Id,
        }
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error comparing periods:', error);
      return null;
    }
  }

  /**
   * Analyze budget vs actual performance
   */
  async analyzeBudgetVsActualAsync(
    periodId: string,
    budgetId?: string
  ): Promise<BudgetAnalysis | null> {
    try {
      const response = await apiClient.post<{ success: boolean; data: BudgetAnalysis }>(
        '/advancedreporting/analyze/budget',
        {
          periodId,
          budgetId,
        }
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error analyzing budget:', error);
      return null;
    }
  }

  /**
   * Get performance metrics for a period
   */
  async getPerformanceMetricsAsync(periodId: string): Promise<PerformanceMetrics | null> {
    try {
      const response = await apiClient.get<{ success: boolean; data: PerformanceMetrics }>(
        `/advancedreporting/metrics/${periodId}`
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return null;
    }
  }

  /**
   * Run what-if scenario analysis
   */
  async runScenarioAsync(periodId: string, assumptions: number): Promise<ScenarioAnalysis | null> {
    try {
      const response = await apiClient.post<{ success: boolean; data: ScenarioAnalysis }>(
        '/advancedreporting/scenario/run',
        {
          periodId,
          assumptions,
        }
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error running scenario analysis:', error);
      return null;
    }
  }

  /**
   * Get custom reports for a branch
   */
  async getCustomReportsAsync(branchId?: string): Promise<CustomReport[]> {
    try {
      const params = branchId ? `?branchId=${branchId}` : '';
      const response = await apiClient.get<{ success: boolean; data: CustomReport[] }>(
        `/advancedreporting/custom-reports${params}`
      );
      return (response as any)?.data || response || [];
    } catch (error) {
      console.error('Error fetching custom reports:', error);
      return [];
    }
  }

  /**
   * Create a new custom report
   */
  async createCustomReportAsync(
    branchId: string,
    name: string,
    queryJson: string
  ): Promise<CustomReport | null> {
    try {
      const response = await apiClient.post<{ success: boolean; data: CustomReport }>(
        '/advancedreporting/custom-reports/create',
        {
          branchId,
          name,
          queryJson,
        }
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error creating custom report:', error);
      return null;
    }
  }

  /**
   * Get comprehensive financial dashboard
   */
  async getDashboardAsync(periodId: string): Promise<{
    metrics: PerformanceMetrics;
    summary: { period: string; asOfDate: string; status: string };
  } | null> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          metrics: PerformanceMetrics;
          summary: { period: string; asOfDate: string; status: string };
        };
      }>(`/advancedreporting/dashboard/${periodId}`);
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      return null;
    }
  }

  /**
   * Format currency for display (Paise to Rupees)
   */
  formatCurrency(paise: number): string {
    const rupees = paise / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(rupees);
  }

  /**
   * Format percentage
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }

  /**
   * Get risk level label based on score
   */
  getRiskLevel(score: number): string {
    if (score > 75) return 'Critical';
    if (score > 50) return 'High';
    if (score > 25) return 'Medium';
    return 'Low';
  }

  /**
   * Get metric trend indicator
   */
  getTrendIndicator(current: number, previous: number): 'up' | 'down' | 'stable' {
    const diff = current - previous;
    if (Math.abs(diff) < 1) return 'stable';
    return diff > 0 ? 'up' : 'down';
  }
}

export const advancedReportingService = new AdvancedReportingService();



