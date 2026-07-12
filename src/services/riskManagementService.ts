import { apiClient } from './apiClient';

export interface RiskProfile {
  id: string;
  periodId: string;
  branchId: string;
  overallRiskScore: number;
  riskLevel: string;
  liquidityRisk: number;
  creditRisk: number;
  operationalRisk: number;
  marketRisk: number;
  keyRisks: string[];
  recommendations: string[];
  createdAt: string;
}

export interface RiskAlert {
  id: string;
  branchId: string;
  title: string;
  message: string;
  severity: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface RiskSummary {
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  overallRiskScore: number;
  riskTrend: string;
}

class RiskManagementService {
  /**
   * Generate risk profile for a period
   */
  async generateRiskProfileAsync(
    periodId: string,
    branchId?: string
  ): Promise<RiskProfile | null> {
    try {
      const response = await apiClient.post<{ success: boolean; data: RiskProfile }>(
        '/riskmanagement/profile/generate',
        {
          periodId,
          branchId,
        }
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error generating risk profile:', error);
      return null;
    }
  }

  /**
   * Get risk profile for a period
   */
  async getRiskProfileAsync(periodId: string, branchId?: string): Promise<RiskProfile | null> {
    try {
      const params = branchId ? `?branchId=${branchId}` : '';
      const response = await apiClient.get<{ success: boolean; data: RiskProfile }>(
        `/riskmanagement/profile/${periodId}${params}`
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error fetching risk profile:', error);
      return null;
    }
  }

  /**
   * Get risk alerts for a branch
   */
  async getAlertsAsync(branchId?: string, severity?: string): Promise<RiskAlert[]> {
    try {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      if (severity) params.append('severity', severity);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient.get<{ success: boolean; data: RiskAlert[] }>(
        `/riskmanagement/alerts${queryString}`
      );
      return (response as any)?.data || response || [];
    } catch (error) {
      console.error('Error fetching risk alerts:', error);
      return [];
    }
  }

  /**
   * Create a new risk alert
   */
  async createAlertAsync(
    branchId: string,
    title: string,
    message: string,
    severity: string
  ): Promise<RiskAlert | null> {
    try {
      const response = await apiClient.post<{ success: boolean; data: RiskAlert }>(
        '/riskmanagement/alerts/create',
        {
          branchId,
          title,
          message,
          severity,
        }
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error creating risk alert:', error);
      return null;
    }
  }

  /**
   * Update alert status
   */
  async updateAlertStatusAsync(alertId: string, status: string): Promise<boolean> {
    try {
      const response = await apiClient.patch<{ success: boolean }>(
        `/riskmanagement/alerts/${alertId}/status`,
        { status }
      );
      return ((response as any)?.data || (response as any)).success ?? false;
    } catch (error) {
      console.error('Error updating alert status:', error);
      return false;
    }
  }

  /**
   * Get risk summary
   */
  async getRiskSummaryAsync(periodId: string): Promise<RiskSummary | null> {
    try {
      const response = await apiClient.get<{ success: boolean; data: RiskSummary }>(
        `/riskmanagement/summary/${periodId}`
      );
      return (response as any)?.data || response || null;
    } catch (error) {
      console.error('Error fetching risk summary:', error);
      return null;
    }
  }

  /**
   * Get critical alerts only
   */
  async getCriticalAlertsAsync(branchId?: string): Promise<RiskAlert[]> {
    try {
      const params = branchId ? `?branchId=${branchId}` : '';
      const response = await apiClient.get<{ success: boolean; data: RiskAlert[] }>(
        `/riskmanagement/alerts/critical${params}`
      );
      return (response as any)?.data || response || [];
    } catch (error) {
      console.error('Error fetching critical alerts:', error);
      return [];
    }
  }

  /**
   * Get risk level label with color coding
   */
  getRiskLevelInfo(
    level: string
  ): {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
  } {
    switch (level.toLowerCase()) {
      case 'critical':
        return {
          label: 'Critical',
          color: '#dc2626',
          bgColor: '#fecaca',
          borderColor: '#991b1b',
        };
      case 'high':
        return {
          label: 'High',
          color: '#ea580c',
          bgColor: '#fed7aa',
          borderColor: '#92400e',
        };
      case 'medium':
        return {
          label: 'Medium',
          color: '#ea8500',
          bgColor: '#fef3c7',
          borderColor: '#b45309',
        };
      case 'low':
      default:
        return {
          label: 'Low',
          color: '#16a34a',
          bgColor: '#dcfce7',
          borderColor: '#15803d',
        };
    }
  }

  /**
   * Get severity indicator icon
   */
  getSeverityIcon(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '⚡';
      case 'low':
      default:
        return 'ℹ️';
    }
  }

  /**
   * Calculate overall risk percentage
   */
  calculateRiskPercentage(riskProfile: RiskProfile): number {
    return Math.round(riskProfile.overallRiskScore);
  }

  /**
   * Get risk component details for display
   */
  getRiskComponents(
    riskProfile: RiskProfile
  ): Array<{ name: string; value: number; label: string }> {
    return [
      {
        name: 'Liquidity Risk',
        value: riskProfile.liquidityRisk,
        label: `${riskProfile.liquidityRisk}/100`,
      },
      {
        name: 'Credit Risk',
        value: riskProfile.creditRisk,
        label: `${riskProfile.creditRisk}/100`,
      },
      {
        name: 'Operational Risk',
        value: riskProfile.operationalRisk,
        label: `${riskProfile.operationalRisk}/100`,
      },
      {
        name: 'Market Risk',
        value: riskProfile.marketRisk,
        label: `${riskProfile.marketRisk}/100`,
      },
    ];
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Calculate alert status badge color
   */
  getAlertStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'open':
        return '#dc2626';
      case 'acknowledged':
        return '#ea8500';
      case 'resolved':
        return '#16a34a';
      default:
        return '#6b7280';
    }
  }
}

export const riskManagementService = new RiskManagementService();


