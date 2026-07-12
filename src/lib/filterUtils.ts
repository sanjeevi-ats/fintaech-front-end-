/**
 * Advanced Filtering Utilities for Microfinance Application
 * Provides reusable filter logic for status, dates, amounts, and custom conditions
 */

// Filter configuration types
export interface FilterConfig {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in' | 'regex';
  value?: any;
  values?: any[];
}

export interface DateRangeFilter {
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface AmountRangeFilter {
  minAmount?: number;
  maxAmount?: number;
}

export interface StatusFilter {
  statuses: string[];
}

// Status configurations for different entities
export const statusOptions = {
  loan: ['draft', 'pending_disburse', 'active', 'closed', 'defaulted'],
  collection: ['pending', 'partial', 'paid', 'overdue', 'waived'],
  receipt: ['draft', 'issued', 'cancelled', 'refunded'],
  user: ['active', 'inactive', 'suspended', 'deleted'],
  dayEnd: ['pending', 'reconciling', 'closed', 'audited'],
  journalEntry: ['draft', 'posted', 'voided', 'reversed'],
  partner: ['active', 'inactive', 'suspended'],
  account: ['active', 'inactive', 'archived'],
};

export type EntityType = keyof typeof statusOptions;

/**
 * Filter items by status
 * @param items - Array of items to filter
 * @param statuses - Array of status values to match (OR logic)
 * @param statusField - Field name containing status (default: 'status')
 */
export function filterByStatus<T>(
  items: T[],
  statuses: string[],
  statusField: string = 'status'
): T[] {
  if (!statuses || statuses.length === 0) return items;
  return items.filter(item => 
    statuses.includes((item as any)[statusField]?.toLowerCase?.() || (item as any)[statusField])
  );
}

/**
 * Filter items by date range
 * @param items - Array of items to filter
 * @param dateRange - Start and end dates
 * @param dateField - Field name containing date (default: 'createdAt')
 */
export function filterByDateRange<T>(
  items: T[],
  dateRange: DateRangeFilter,
  dateField: string = 'createdAt'
): T[] {
  if (!dateRange.startDate && !dateRange.endDate) return items;

  const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
  const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

  return items.filter(item => {
    const itemDate = new Date((item as any)[dateField]);
    
    if (startDate && itemDate < startDate) return false;
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (itemDate > endOfDay) return false;
    }
    
    return true;
  });
}

/**
 * Filter items by amount range
 * @param items - Array of items to filter
 * @param amountRange - Min and max amounts
 * @param amountField - Field name containing amount (default: 'totalAmount')
 */
export function filterByAmountRange<T>(
  items: T[],
  amountRange: AmountRangeFilter,
  amountField: string = 'totalAmount'
): T[] {
  if (amountRange.minAmount === undefined && amountRange.maxAmount === undefined) {
    return items;
  }

  return items.filter(item => {
    const amount = (item as any)[amountField] || 0;
    
    if (amountRange.minAmount !== undefined && amount < amountRange.minAmount) {
      return false;
    }
    if (amountRange.maxAmount !== undefined && amount > amountRange.maxAmount) {
      return false;
    }
    
    return true;
  });
}

/**
 * Apply multiple filters to items (AND logic between filter types)
 * @param items - Array of items to filter
 * @param filters - Multiple filter configurations to apply
 */
export function applyFilters<T>(
  items: T[],
  filters: {
    status?: StatusFilter;
    dateRange?: DateRangeFilter;
    amountRange?: AmountRangeFilter;
    statusField?: string;
    dateField?: string;
    amountField?: string;
  }
): T[] {
  let filtered = items;

  if (filters.status) {
    filtered = filterByStatus(filtered, filters.status.statuses, filters.statusField);
  }

  if (filters.dateRange) {
    filtered = filterByDateRange(filtered, filters.dateRange, filters.dateField);
  }

  if (filters.amountRange) {
    filtered = filterByAmountRange(filtered, filters.amountRange, filters.amountField);
  }

  return filtered;
}

/**
 * Filter items by custom predicate
 * @param items - Array of items to filter
 * @param predicate - Custom filter function
 */
export function filterByPredicate<T>(
  items: T[],
  predicate: (item: T) => boolean
): T[] {
  return items.filter(predicate);
}

/**
 * Combine multiple filter predicates with AND logic
 * @param predicates - Array of filter functions
 */
export function combineFilters<T>(
  ...predicates: Array<(item: T) => boolean>
): (item: T) => boolean {
  return (item: T) => predicates.every(pred => pred(item));
}

/**
 * Get filter options for an entity type
 * @param entityType - Type of entity
 */
export function getStatusOptions(entityType: EntityType): string[] {
  return statusOptions[entityType] || [];
}

/**
 * Create filter summary string for UI display
 * @param filters - Active filters
 * @param statusField - Status field name
 */
export function createFilterSummary(
  filters: {
    status?: StatusFilter;
    dateRange?: DateRangeFilter;
    amountRange?: AmountRangeFilter;
  }
): string[] {
  const summary: string[] = [];

  if (filters.status && filters.status.statuses.length > 0) {
    summary.push(`Status: ${filters.status.statuses.join(', ')}`);
  }

  if (filters.dateRange) {
    if (filters.dateRange.startDate) {
      const start = new Date(filters.dateRange.startDate).toLocaleDateString();
      summary.push(`From: ${start}`);
    }
    if (filters.dateRange.endDate) {
      const end = new Date(filters.dateRange.endDate).toLocaleDateString();
      summary.push(`To: ${end}`);
    }
  }

  if (filters.amountRange) {
    if (filters.amountRange.minAmount !== undefined) {
      summary.push(`Min: ₹${filters.amountRange.minAmount.toLocaleString()}`);
    }
    if (filters.amountRange.maxAmount !== undefined) {
      summary.push(`Max: ₹${filters.amountRange.maxAmount.toLocaleString()}`);
    }
  }

  return summary;
}

/**
 * Check if any filters are active
 * @param filters - Filter configuration
 */
export function hasActiveFilters(filters: {
  status?: StatusFilter;
  dateRange?: DateRangeFilter;
  amountRange?: AmountRangeFilter;
}): boolean {
  if (filters.status?.statuses && filters.status.statuses.length > 0) return true;
  if (filters.dateRange?.startDate || filters.dateRange?.endDate) return true;
  if (filters.amountRange?.minAmount !== undefined || filters.amountRange?.maxAmount !== undefined) {
    return true;
  }
  return false;
}

/**
 * Reset all filters to default
 */
export function resetFilters() {
  return {
    status: { statuses: [] },
    dateRange: { startDate: undefined, endDate: undefined },
    amountRange: { minAmount: undefined, maxAmount: undefined },
  };
}

/**
 * Format amount for filter display
 * @param amount - Amount in smallest currency unit (paise)
 */
export function formatAmountForFilter(amount: number): string {
  return `₹${(amount / 100).toLocaleString()}`;
}

/**
 * Parse date string to Date object
 * @param dateString - Date string in YYYY-MM-DD format
 */
export function parseFilterDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00');
}

/**
 * Get date range presets for quick filtering
 */
export const dateRangePresets = {
  today: (): DateRangeFilter => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return { startDate: today, endDate: today };
  },
  thisWeek: (): DateRangeFilter => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return { startDate: weekStart, endDate: today };
  },
  thisMonth: (): DateRangeFilter => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    return { startDate: monthStart, endDate: today };
  },
  lastMonth: (): DateRangeFilter => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    monthStart.setHours(0, 0, 0, 0);
    monthEnd.setHours(23, 59, 59, 999);
    return { startDate: monthStart, endDate: monthEnd };
  },
  last90Days: (): DateRangeFilter => {
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);
    ninetyDaysAgo.setHours(0, 0, 0, 0);
    return { startDate: ninetyDaysAgo, endDate: today };
  },
  lastYear: (): DateRangeFilter => {
    const today = new Date();
    const yearAgo = new Date(today);
    yearAgo.setFullYear(today.getFullYear() - 1);
    yearAgo.setHours(0, 0, 0, 0);
    return { startDate: yearAgo, endDate: today };
  },
};

/**
 * Calculate filter statistics
 * @param items - Array of items
 * @param statusField - Field containing status
 */
export function calculateFilterStats<T>(
  items: T[],
  statusField: string = 'status'
): Record<string, number> {
  const stats: Record<string, number> = {};

  items.forEach(item => {
    const status = (item as any)[statusField]?.toLowerCase?.() || (item as any)[statusField];
    stats[status] = (stats[status] || 0) + 1;
  });

  return stats;
}
