/**
 * Reporting & Analytics Utilities for Microfinance Application
 * Provides reusable functionality for reports, dashboards, and data summaries
 */

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ReportPeriod {
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface SummaryStatistics {
  total: number;
  count: number;
  average: number;
  min: number;
  max: number;
  median: number;
  sum: number;
}

export interface TrendData {
  date: Date;
  value: number;
  label: string;
}

export interface CategorizedData {
  category: string;
  value: number;
  percentage: number;
  count?: number;
}

/**
 * Get date range for common reporting periods
 */
export const reportPeriods = {
  today: (): ReportPeriod => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    return {
      type: 'daily',
      startDate: today,
      endDate: endOfDay,
      label: 'Today',
    };
  },

  thisWeek: (): ReportPeriod => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return {
      type: 'weekly',
      startDate: weekStart,
      endDate: today,
      label: 'This Week',
    };
  },

  lastWeek: (): ReportPeriod => {
    const today = new Date();
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
    lastWeekStart.setHours(0, 0, 0, 0);
    return {
      type: 'weekly',
      startDate: lastWeekStart,
      endDate: lastWeekEnd,
      label: 'Last Week',
    };
  },

  thisMonth: (): ReportPeriod => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    return {
      type: 'monthly',
      startDate: monthStart,
      endDate: today,
      label: 'This Month',
    };
  },

  lastMonth: (): ReportPeriod => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    monthStart.setHours(0, 0, 0, 0);
    monthEnd.setHours(23, 59, 59, 999);
    return {
      type: 'monthly',
      startDate: monthStart,
      endDate: monthEnd,
      label: 'Last Month',
    };
  },

  thisQuarter: (): ReportPeriod => {
    const today = new Date();
    const quarter = Math.floor(today.getMonth() / 3);
    const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
    quarterStart.setHours(0, 0, 0, 0);
    return {
      type: 'quarterly',
      startDate: quarterStart,
      endDate: today,
      label: `Q${quarter + 1} ${today.getFullYear()}`,
    };
  },

  thisYear: (): ReportPeriod => {
    const today = new Date();
    const yearStart = new Date(today.getFullYear(), 0, 1);
    yearStart.setHours(0, 0, 0, 0);
    return {
      type: 'yearly',
      startDate: yearStart,
      endDate: today,
      label: `Year ${today.getFullYear()}`,
    };
  },

  last30Days: (): ReportPeriod => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    return {
      type: 'custom',
      startDate: thirtyDaysAgo,
      endDate: today,
      label: 'Last 30 Days',
    };
  },

  last90Days: (): ReportPeriod => {
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);
    ninetyDaysAgo.setHours(0, 0, 0, 0);
    return {
      type: 'custom',
      startDate: ninetyDaysAgo,
      endDate: today,
      label: 'Last 90 Days',
    };
  },
};

/**
 * Filter data by date range
 */
export function filterByDateRange<T>(
  items: T[],
  dateRange: ReportPeriod,
  dateField: string = 'createdAt'
): T[] {
  return items.filter(item => {
    const itemDate = new Date((item as any)[dateField]);
    return itemDate >= dateRange.startDate && itemDate <= dateRange.endDate;
  });
}

/**
 * Calculate summary statistics
 */
export function calculateSummary(values: number[]): SummaryStatistics {
  if (values.length === 0) {
    return { total: 0, count: 0, average: 0, min: 0, max: 0, median: 0, sum: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const count = sorted.length;
  const average = sum / count;
  const median = count % 2 === 0 ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2 : sorted[Math.floor(count / 2)];

  return {
    total: sum,
    count,
    average: Math.round(average * 100) / 100,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median,
    sum,
  };
}

/**
 * Group data by category and calculate percentages
 */
export function categorizeData<T>(
  items: T[],
  categoryField: string
): CategorizedData[] {
  const categories: Record<string, number> = {};
  const total = items.length;

  items.forEach(item => {
    const category = (item as any)[categoryField] || 'unknown';
    categories[category] = (categories[category] || 0) + 1;
  });

  return Object.entries(categories)
    .map(([category, count]) => ({
      category,
      value: count,
      percentage: total === 0 ? 0 : Math.round((count / total) * 100),
      count,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Generate trend data by date intervals
 */
export function generateTrendData<T>(
  items: T[],
  dateRange: ReportPeriod,
  dateField: string = 'createdAt',
  interval: 'day' | 'week' | 'month' = 'day'
): TrendData[] {
  const trendMap: Record<string, number> = {};
  const startDate = new Date(dateRange.startDate);
  const endDate = new Date(dateRange.endDate);

  // Initialize trend map with all dates in range
  const current = new Date(startDate);
  while (current <= endDate) {
    const key = formatDateForTrend(current, interval);
    trendMap[key] = 0;

    // Increment based on interval
    if (interval === 'day') {
      current.setDate(current.getDate() + 1);
    } else if (interval === 'week') {
      current.setDate(current.getDate() + 7);
    } else if (interval === 'month') {
      current.setMonth(current.getMonth() + 1);
    }
  }

  // Populate with actual data
  items.forEach(item => {
    const itemDate = new Date((item as any)[dateField]);
    if (itemDate >= startDate && itemDate <= endDate) {
      const key = formatDateForTrend(itemDate, interval);
      trendMap[key] = (trendMap[key] || 0) + 1;
    }
  });

  // Convert to array
  return Object.entries(trendMap).map(([date, count]) => ({
    date: new Date(date),
    value: count,
    label: date,
  }));
}

/**
 * Format date for trend grouping
 */
function formatDateForTrend(date: Date, interval: 'day' | 'week' | 'month'): string {
  if (interval === 'day') {
    return date.toISOString().split('T')[0];
  } else if (interval === 'week') {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return weekStart.toISOString().split('T')[0];
  } else if (interval === 'month') {
    return date.toISOString().substring(0, 7);
  }
  return date.toISOString().split('T')[0];
}

/**
 * Calculate year-over-year comparison
 */
export function calculateYoYComparison<T>(
  items: T[],
  dateField: string = 'createdAt'
): { current: number; previous: number; growth: number; percentage: number } {
  const today = new Date();
  const thisYearStart = new Date(today.getFullYear(), 0, 1);
  const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
  const lastYearEnd = new Date(today.getFullYear(), 0, 0);

  const currentYear = items.filter(item => {
    const itemDate = new Date((item as any)[dateField]);
    return itemDate >= thisYearStart && itemDate <= today;
  }).length;

  const lastYear = items.filter(item => {
    const itemDate = new Date((item as any)[dateField]);
    return itemDate >= lastYearStart && itemDate <= lastYearEnd;
  }).length;

  const growth = currentYear - lastYear;
  const percentage = lastYear === 0 ? 0 : Math.round((growth / lastYear) * 100);

  return {
    current: currentYear,
    previous: lastYear,
    growth,
    percentage,
  };
}

/**
 * Calculate period-over-period comparison
 */
export function calculatePoPComparison<T>(
  items: T[],
  currentPeriod: ReportPeriod,
  previousPeriod: ReportPeriod,
  dateField: string = 'createdAt'
): { current: number; previous: number; growth: number; percentage: number } {
  const current = filterByDateRange(items, currentPeriod, dateField).length;
  const previous = filterByDateRange(items, previousPeriod, dateField).length;
  const growth = current - previous;
  const percentage = previous === 0 ? 0 : Math.round((growth / previous) * 100);

  return {
    current,
    previous,
    growth,
    percentage,
  };
}

/**
 * Format number for reporting
 */
export function formatReportNumber(value: number, decimal: number = 2): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(decimal)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(decimal)}K`;
  }
  return value.toFixed(decimal);
}

/**
 * Format currency for reporting
 */
export function formatReportCurrency(value: number, currency: string = '₹'): string {
  const formatted = (value / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return `${currency}${formatted}`;
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Get status distribution
 */
export function getStatusDistribution<T>(
  items: T[],
  statusField: string = 'status'
): CategorizedData[] {
  return categorizeData(items, statusField);
}

/**
 * Get amount distribution buckets
 */
export function getAmountDistribution(amounts: number[], bucketSize: number = 100000): CategorizedData[] {
  const buckets: Record<string, number> = {};

  amounts.forEach(amount => {
    const bucket = Math.floor(amount / bucketSize) * bucketSize;
    const bucketEnd = bucket + bucketSize;
    const bucketLabel = `₹${formatReportNumber(bucket)} - ₹${formatReportNumber(bucketEnd)}`;
    buckets[bucketLabel] = (buckets[bucketLabel] || 0) + 1;
  });

  const total = amounts.length;
  return Object.entries(buckets)
    .map(([category, count]) => ({
      category,
      value: count,
      percentage: total === 0 ? 0 : Math.round((count / total) * 100),
      count,
    }))
    .sort((a, b) => a.value - b.value);
}

/**
 * Generate simple text report
 */
export function generateTextReport(title: string, data: Record<string, any>): string {
  let report = `${'='.repeat(60)}\n`;
  report += `${title.padEnd(60)}\n`;
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `${'='.repeat(60)}\n\n`;

  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'object') {
      report += `${key}:\n`;
      Object.entries(value).forEach(([subKey, subValue]) => {
        report += `  ${subKey}: ${subValue}\n`;
      });
    } else {
      report += `${key}: ${value}\n`;
    }
  });

  report += `\n${'='.repeat(60)}\n`;
  return report;
}

/**
 * Calculate completion rate
 */
export function calculateCompletionRate(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Get performance rating based on value
 */
export function getPerformanceRating(value: number, threshold: { good: number; fair: number }): 'excellent' | 'good' | 'fair' | 'poor' {
  if (value >= threshold.good) return 'excellent';
  if (value >= threshold.fair) return 'good';
  if (value >= threshold.fair * 0.5) return 'fair';
  return 'poor';
}

// ============================================================================
// PHASE 10: Advanced Analytics Functions
// ============================================================================

/**
 * Predict trend using linear regression
 */
export function predictTrend(data: number[]): { predicted: number[]; confidence: number } {
  if (data.length < 2) return { predicted: data, confidence: 0 };

  const n = data.length;
  const xMean = (n - 1) / 2; // Average of indices
  const yMean = data.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (data[i] - yMean);
    denominator += (i - xMean) * (i - xMean);
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;

  // Generate predicted values
  const predicted = data.map((_, i) => slope * i + intercept);

  // Calculate R-squared for confidence
  const ssRes = data.reduce((sum, actual, i) => sum + Math.pow(actual - predicted[i], 2), 0);
  const ssTot = data.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
  const confidence = ssTot === 0 ? 0 : Math.max(0, Math.min(1, 1 - ssRes / ssTot));

  return { predicted, confidence };
}

/**
 * Detect outliers in data
 */
export function getOutliers(data: number[], threshold: number = 2): number[] {
  if (data.length < 2) return [];

  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);

  return data.filter(val => Math.abs(val - mean) > threshold * stdDev);
}

/**
 * Calculate health score (0-100)
 */
export function calculateHealthScore(metrics: {
  repayment?: number; // 0-100
  quality?: number; // 0-100
  efficiency?: number; // 0-100
  growth?: number; // 0-100
}): number {
  const values = [
    metrics.repayment ?? 75,
    metrics.quality ?? 80,
    metrics.efficiency ?? 85,
    metrics.growth ?? 70,
  ];

  const average = values.reduce((a, b) => a + b, 0) / values.length;

  // Apply weights
  const weighted =
    (metrics.repayment ?? 75) * 0.4 + // Repayment most critical
    (metrics.quality ?? 80) * 0.35 +
    (metrics.efficiency ?? 85) * 0.15 +
    (metrics.growth ?? 70) * 0.1;

  return Math.round(Math.min(100, Math.max(0, weighted)));
}

/**
 * Generate alerts based on thresholds
 */
export interface Alert {
  type: 'success' | 'warning' | 'danger';
  message: string;
  action?: string;
}

export function generateAlerts(metrics: {
  collectionRate?: number;
  parRate?: number;
  growth?: number;
  liquidity?: number;
}): Alert[] {
  const alerts: Alert[] = [];

  // Collection alerts
  if (metrics.collectionRate !== undefined) {
    if (metrics.collectionRate < 80) {
      alerts.push({
        type: 'danger',
        message: `Collection rate critically low at ${metrics.collectionRate}%`,
        action: 'View collection details',
      });
    } else if (metrics.collectionRate < 90) {
      alerts.push({
        type: 'warning',
        message: `Collection rate below target: ${metrics.collectionRate}%`,
        action: 'View collection details',
      });
    } else {
      alerts.push({
        type: 'success',
        message: `Collection rate on target: ${metrics.collectionRate}%`,
      });
    }
  }

  // PAR alerts
  if (metrics.parRate !== undefined) {
    if (metrics.parRate > 5) {
      alerts.push({
        type: 'danger',
        message: `Portfolio at risk exceeds threshold: ${metrics.parRate}%`,
        action: 'View overdue loans',
      });
    } else if (metrics.parRate > 3) {
      alerts.push({
        type: 'warning',
        message: `Portfolio at risk trending up: ${metrics.parRate}%`,
      });
    }
  }

  // Growth alerts
  if (metrics.growth !== undefined) {
    if (metrics.growth < 5) {
      alerts.push({
        type: 'warning',
        message: `Loan growth slowing: ${metrics.growth}%`,
      });
    }
  }

  return alerts;
}

/**
 * Format alert for display
 */
export function formatAlert(alert: Alert): string {
  const prefix =
    alert.type === 'success' ? '✓' : alert.type === 'warning' ? '⚠' : '✗';
  return `${prefix} ${alert.message}`;
}
