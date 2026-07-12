/**
 * Bulk Operations Utilities for Microfinance Application
 * Provides reusable functionality for multi-select, bulk updates, and batch export
 */

export interface SelectionState {
  selectedIds: Set<string>;
  isAllSelected: boolean;
  totalCount: number;
}

export interface BulkUpdatePayload {
  ids: string[];
  updateData: Record<string, any>;
  reason?: string;
  timestamp?: Date;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'json';
  fields: string[];
  filename?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  total: number;
  errors: Array<{ id: string; error: string }>;
}

/**
 * Initialize selection state
 */
export function initializeSelection(totalCount: number): SelectionState {
  return {
    selectedIds: new Set(),
    isAllSelected: false,
    totalCount,
  };
}

/**
 * Toggle single item selection
 */
export function toggleItemSelection(
  state: SelectionState,
  itemId: string
): SelectionState {
  const newSelected = new Set(state.selectedIds);
  if (newSelected.has(itemId)) {
    newSelected.delete(itemId);
  } else {
    newSelected.add(itemId);
  }

  return {
    ...state,
    selectedIds: newSelected,
    isAllSelected: newSelected.size === state.totalCount && state.totalCount > 0,
  };
}

/**
 * Toggle all items selection
 */
export function toggleAllSelection(state: SelectionState, itemIds: string[]): SelectionState {
  if (state.isAllSelected) {
    return {
      ...state,
      selectedIds: new Set(),
      isAllSelected: false,
    };
  } else {
    return {
      ...state,
      selectedIds: new Set(itemIds),
      isAllSelected: true,
    };
  }
}

/**
 * Clear all selections
 */
export function clearSelection(state: SelectionState): SelectionState {
  return {
    ...state,
    selectedIds: new Set(),
    isAllSelected: false,
  };
}

/**
 * Check if item is selected
 */
export function isItemSelected(state: SelectionState, itemId: string): boolean {
  return state.selectedIds.has(itemId);
}

/**
 * Get number of selected items
 */
export function getSelectedCount(state: SelectionState): number {
  return state.selectedIds.size;
}

/**
 * Convert selection to array of IDs
 */
export function getSelectedIds(state: SelectionState): string[] {
  return Array.from(state.selectedIds);
}

/**
 * Generate CSV content from data
 */
export function generateCSV<T>(
  data: T[],
  fields: (keyof T)[],
  headers?: string[]
): string {
  const headerRow = headers || fields.map(f => String(f));
  const csvRows: string[] = [headerRow.join(',')];

  data.forEach(item => {
    const row = fields.map(field => {
      const value = item[field];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }
      
      if (typeof value === 'string') {
        // Escape quotes and wrap in quotes if contains comma
        const escaped = value.replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      }
      
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      
      return String(value);
    });
    
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Download file to user's device
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Export data to CSV and download
 */
export function exportToCSV<T>(
  data: T[],
  fields: (keyof T)[],
  filename: string,
  headers?: string[]
): void {
  const csv = generateCSV(data, fields, headers);
  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export data to JSON and download
 */
export function exportToJSON<T>(data: T[], filename: string, pretty: boolean = true): void {
  const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  downloadFile(json, `${filename}.json`, 'application/json;charset=utf-8;');
}

/**
 * Calculate bulk operation progress
 */
export function calculateProgress(processed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((processed / total) * 100);
}

/**
 * Format bulk operation result for display
 */
export function formatBulkResult(result: BulkOperationResult): string {
  const successRate = result.total === 0 ? 0 : Math.round((result.success / result.total) * 100);
  return `✓ ${result.success} successful, ✗ ${result.failed} failed (${successRate}% success rate)`;
}

/**
 * Get bulk operation summary statistics
 */
export function getBulkSummary<T>(
  items: T[],
  selectedIds: Set<string>,
  getIdFn: (item: T) => string
): {
  totalItems: number;
  selectedCount: number;
  unselectedCount: number;
  selectionPercentage: number;
} {
  const selectedCount = selectedIds.size;
  const totalItems = items.length;
  const unselectedCount = totalItems - selectedCount;
  const selectionPercentage = totalItems === 0 ? 0 : Math.round((selectedCount / totalItems) * 100);

  return {
    totalItems,
    selectedCount,
    unselectedCount,
    selectionPercentage,
  };
}

/**
 * Filter items by selection
 */
export function filterBySelection<T>(
  items: T[],
  selectedIds: Set<string>,
  getIdFn: (item: T) => string
): T[] {
  return items.filter(item => selectedIds.has(getIdFn(item)));
}

/**
 * Create bulk update payload
 */
export function createBulkUpdatePayload(
  selectedIds: string[],
  updateData: Record<string, any>,
  reason?: string
): BulkUpdatePayload {
  return {
    ids: selectedIds,
    updateData,
    reason,
    timestamp: new Date(),
  };
}

/**
 * Validate bulk operation
 */
export function validateBulkOperation(selectedIds: Set<string>): { valid: boolean; error?: string } {
  if (selectedIds.size === 0) {
    return { valid: false, error: 'Please select at least one item' };
  }

  if (selectedIds.size > 1000) {
    return { valid: false, error: 'Cannot perform bulk operations on more than 1000 items' };
  }

  return { valid: true };
}

/**
 * Create confirmation message for bulk operations
 */
export function createConfirmationMessage(
  selectedCount: number,
  operation: 'update' | 'delete' | 'export' | 'send'
): string {
  const operationText = {
    update: 'update',
    delete: 'delete',
    export: 'export',
    send: 'send notifications to',
  };

  return `Are you sure you want to ${operationText[operation]} ${selectedCount} item${selectedCount > 1 ? 's' : ''}?`;
}

/**
 * Group items by status for bulk operations
 */
export function groupByStatus<T>(
  items: T[],
  statusField: string
): Record<string, T[]> {
  return items.reduce(
    (acc, item) => {
      const status = (item as any)[statusField] || 'unknown';
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Generate bulk operation report
 */
export function generateBulkReport(
  result: BulkOperationResult,
  operation: string,
  timestamp: Date = new Date()
): string {
  const report = `
Bulk Operation Report
Operation: ${operation}
Timestamp: ${timestamp.toISOString()}
---
Total Processed: ${result.total}
Successful: ${result.success}
Failed: ${result.failed}
Success Rate: ${result.total === 0 ? 0 : Math.round((result.success / result.total) * 100)}%
${
  result.errors.length > 0
    ? `
Errors:
${result.errors.map(e => `- ${e.id}: ${e.error}`).join('\n')}
`
    : ''
}
`;
  return report.trim();
}

/**
 * Debounce bulk operation to prevent accidental duplicate submissions
 */
export function createBulkOperationDebouncer(delayMs: number = 300) {
  let timeoutId: NodeJS.Timeout | null = null;
  let isPending = false;

  return {
    execute: async (fn: () => Promise<void>): Promise<void> => {
      if (isPending) {
        return;
      }

      return new Promise(resolve => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(async () => {
          isPending = true;
          try {
            await fn();
          } finally {
            isPending = false;
            timeoutId = null;
            resolve();
          }
        }, delayMs);
      });
    },

    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      isPending = false;
    },

    isPending: () => isPending,
  };
}
