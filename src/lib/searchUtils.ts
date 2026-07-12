/**
 * Advanced Search Utilities for Code-Based Search & Filtering
 * Phase 6: Code Search & Filtering Implementation
 * 
 * Provides utilities for searching entities by business codes, names, and other properties
 */

export interface SearchResult<T> {
  item: T;
  score: number;
  matchType: 'code' | 'name' | 'id' | 'phone';
  matchField: string;
}

/**
 * Code Search Configuration by Entity Type
 */
export const codeSearchConfig = {
  customer: {
    codeField: 'code',
    codeFormat: 'CUS####',
    searchFields: ['code', 'name', 'phone', 'id'],
    displayField: 'name',
    color: '#10b981'
  },
  user: {
    codeField: 'code',
    codeFormat: 'USR####',
    searchFields: ['code', 'email', 'firstName', 'lastName'],
    displayField: 'email',
    color: '#8b5cf6'
  },
  loan: {
    codeField: 'loanCode',
    codeFormat: 'LN####',
    searchFields: ['loanCode', 'customerCode', 'customerName', 'id'],
    displayField: 'customerName',
    color: '#6366f1'
  },
  installment: {
    codeField: 'code',
    codeFormat: 'INST####',
    searchFields: ['code', 'no', 'dueDate'],
    displayField: 'no',
    color: '#06b6d4'
  },
  receipt: {
    codeField: 'receiptCode',
    codeFormat: 'RCP####',
    searchFields: ['receiptCode', 'receiptNumber'],
    displayField: 'receiptNumber',
    color: '#f59e0b'
  },
  partner: {
    codeField: 'code',
    codeFormat: 'PAR####',
    searchFields: ['code', 'name', 'email'],
    displayField: 'name',
    color: '#ec4899'
  },
  account: {
    codeField: 'code',
    codeFormat: 'ACC####',
    searchFields: ['code', 'accountName'],
    displayField: 'accountName',
    color: '#0d9488'
  },
  journalEntry: {
    codeField: 'code',
    codeFormat: 'JE####',
    searchFields: ['code', 'description', 'reference'],
    displayField: 'description',
    color: '#6366f1'
  },
  dayEnd: {
    codeField: 'code',
    codeFormat: 'DE####',
    searchFields: ['code', 'date'],
    displayField: 'date',
    color: '#10b981'
  }
};

/**
 * Calculate search relevance score
 * Higher score = better match
 */
export function calculateRelevance(
  query: string,
  target: string,
  matchType: 'exact' | 'starts' | 'contains'
): number {
  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();

  if (matchType === 'exact') {
    return targetLower === queryLower ? 100 : 0;
  } else if (matchType === 'starts') {
    return targetLower.startsWith(queryLower) ? 80 : 0;
  } else {
    return targetLower.includes(queryLower) ? 50 : 0;
  }
}

/**
 * Generic search function for any entity
 */
export function searchEntity<T extends Record<string, any>>(
  items: T[],
  query: string,
  searchFields: string[],
  codeField?: string
): SearchResult<T>[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const queryLower = query.toLowerCase().trim();
  const results: SearchResult<T>[] = [];

  for (const item of items) {
    let maxScore = 0;
    let bestMatch: SearchResult<T> | null = null;

    for (const field of searchFields) {
      const value = String(item[field] || '').toLowerCase();
      if (!value) continue;

      // Exact match (highest priority)
      if (value === queryLower) {
        maxScore = 100;
        bestMatch = {
          item,
          score: 100,
          matchType: field === codeField ? 'code' : 'name',
          matchField: field
        };
        break;
      }

      // Starts with (high priority for codes)
      if (value.startsWith(queryLower) && value.length - queryLower.length < 4) {
        const score = 85 - (value.length - queryLower.length);
        if (score > maxScore) {
          maxScore = score;
          bestMatch = {
            item,
            score,
            matchType: field === codeField ? 'code' : 'name',
            matchField: field
          };
        }
      }

      // Contains (medium priority)
      if (value.includes(queryLower)) {
        const score = 60;
        if (score > maxScore) {
          maxScore = score;
          bestMatch = {
            item,
            score,
            matchType: field === codeField ? 'code' : 'name',
            matchField: field
          };
        }
      }
    }

    if (bestMatch) {
      results.push(bestMatch);
    }
  }

  // Sort by score (descending)
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Validate code format
 */
export function isValidCodeFormat(code: string, codeFormat: string): boolean {
  // Remove special chars to check basic format
  const codePattern = codeFormat.replace(/#/g, '\\d');
  const regex = new RegExp(`^${codePattern}$`);
  return regex.test(code);
}

/**
 * Format code for display
 */
export function formatCodeForDisplay(code: string, codeFormat: string): string {
  if (!code) return 'N/A';
  
  // Extract prefix and number
  const match = code.match(/([A-Z]+)(\d+)/);
  if (match) {
    const [, prefix, number] = match;
    return `${prefix}${number.padStart(4, '0')}`;
  }
  
  return code;
}

/**
 * Generate code suggestion hints
 */
export function getCodeSuggestion(codeFormat: string): string {
  return codeFormat.replace(/#/g, '•');
}

/**
 * Filter by code prefix
 */
export function filterByCodePrefix<T extends Record<string, any>>(
  items: T[],
  prefix: string,
  codeField: string
): T[] {
  if (!prefix) return items;
  
  const prefixLower = prefix.toLowerCase();
  return items.filter(item => {
    const code = String(item[codeField] || '').toLowerCase();
    return code.startsWith(prefixLower);
  });
}

/**
 * Group items by code prefix
 */
export function groupByCodePrefix<T extends Record<string, any>>(
  items: T[],
  codeField: string
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  
  for (const item of items) {
    const code = String(item[codeField] || '');
    const prefix = code.match(/^[A-Z]+/)?.[0] || 'OTHER';
    
    if (!groups[prefix]) {
      groups[prefix] = [];
    }
    groups[prefix].push(item);
  }
  
  return groups;
}

/**
 * Parse code input (handle various formats)
 */
export function parseCodeInput(input: string): { prefix: string; number: number } | null {
  const trimmed = input.trim().toUpperCase();
  const match = trimmed.match(/^([A-Z]+)(\d+)$/);
  
  if (!match) return null;
  
  const [, prefix, number] = match;
  return { prefix, number: parseInt(number) };
}

/**
 * Generate code range query (for bulk operations)
 */
export function generateCodeRange(
  prefix: string,
  startNum: number,
  endNum: number
): string[] {
  const codes: string[] = [];
  for (let i = startNum; i <= endNum; i++) {
    codes.push(`${prefix}${i.toString().padStart(4, '0')}`);
  }
  return codes;
}

/**
 * Check if query is a code-like pattern
 */
export function isCodeLikePattern(query: string): boolean {
  // Patterns like: CUS0001, LN0001, etc.
  return /^[A-Z]+\d+$/.test(query.toUpperCase());
}

/**
 * Fuzzy search with code priority
 */
export function fuzzySearchWithCodePriority<T extends Record<string, any>>(
  items: T[],
  query: string,
  config: typeof codeSearchConfig[keyof typeof codeSearchConfig]
): SearchResult<T>[] {
  if (!query.trim()) return [];

  const queryLower = query.toLowerCase();
  const results: SearchResult<T>[] = [];
  const isCodePattern = isCodeLikePattern(query);

  for (const item of items) {
    let bestScore = 0;
    let bestMatch: SearchResult<T> | null = null;

    // Priority 1: Code match (if query looks like a code)
    if (isCodePattern) {
      const codeValue = String(item[config.codeField] || '').toLowerCase();
      if (codeValue.includes(queryLower)) {
        bestScore = codeValue === queryLower ? 100 : 90;
        bestMatch = {
          item,
          score: bestScore,
          matchType: 'code',
          matchField: config.codeField
        };
      }
    }

    // Priority 2: Exact field matches
    if (bestScore < 100) {
      for (const field of config.searchFields) {
        const value = String(item[field] || '').toLowerCase();
        if (value === queryLower) {
          bestScore = 95;
          bestMatch = {
            item,
            score: bestScore,
            matchType: field === config.codeField ? 'code' : 'name',
            matchField: field
          };
          break;
        }
      }
    }

    // Priority 3: Starts with match
    if (bestScore < 95) {
      for (const field of config.searchFields) {
        const value = String(item[field] || '').toLowerCase();
        if (value.startsWith(queryLower)) {
          const score = 80 - (value.length - queryLower.length) * 0.1;
          if (score > bestScore) {
            bestScore = score;
            bestMatch = {
              item,
              score,
              matchType: field === config.codeField ? 'code' : 'name',
              matchField: field
            };
          }
        }
      }
    }

    // Priority 4: Contains match
    if (bestScore < 80) {
      for (const field of config.searchFields) {
        const value = String(item[field] || '').toLowerCase();
        if (value.includes(queryLower)) {
          const score = 60;
          if (score > bestScore) {
            bestScore = score;
            bestMatch = {
              item,
              score,
              matchType: field === config.codeField ? 'code' : 'name',
              matchField: field
            };
          }
        }
      }
    }

    if (bestMatch && bestMatch.score > 0) {
      results.push(bestMatch);
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Highlight search query in text
 */
export function highlightSearchQuery(text: string, query: string): { before: string; highlight: string; after: string } {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) {
    return { before: text, highlight: '', after: '' };
  }
  
  return {
    before: text.slice(0, index),
    highlight: text.slice(index, index + query.length),
    after: text.slice(index + query.length)
  };
}

/**
 * Export search history to localStorage
 */
export function saveSearchHistory(query: string, entityType: string): void {
  const key = `search_history_${entityType}`;
  let history: string[] = [];
  
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      history = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load search history:', e);
  }

  // Add query if not empty
  if (query.trim()) {
    // Remove duplicates and add to front
    history = [query.trim(), ...history.filter(q => q !== query.trim())].slice(0, 10);
    
    try {
      localStorage.setItem(key, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save search history:', e);
    }
  }
}

/**
 * Get search history from localStorage
 */
export function getSearchHistory(entityType: string): string[] {
  const key = `search_history_${entityType}`;
  
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.warn('Failed to get search history:', e);
    return [];
  }
}

/**
 * Clear search history
 */
export function clearSearchHistory(entityType?: string): void {
  try {
    if (entityType) {
      localStorage.removeItem(`search_history_${entityType}`);
    } else {
      // Clear all search histories
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('search_history_')) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (e) {
    console.warn('Failed to clear search history:', e);
  }
}
