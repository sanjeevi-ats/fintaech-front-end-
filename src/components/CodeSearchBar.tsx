'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, Zap } from 'lucide-react';
import { 
  getSearchHistory, 
  saveSearchHistory, 
  clearSearchHistory,
  isCodeLikePattern,
  codeSearchConfig 
} from '@/lib/searchUtils';

interface CodeSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  entityType: keyof typeof codeSearchConfig;
  showHistory?: boolean;
  autoFocus?: boolean;
  loading?: boolean;
}

export default function CodeSearchBar({
  onSearch,
  placeholder,
  entityType,
  showHistory = true,
  autoFocus = false,
  loading = false
}: CodeSearchBarProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const config = codeSearchConfig[entityType];

  // Load search history on mount
  useEffect(() => {
    if (showHistory) {
      setHistory(getSearchHistory(entityType));
    }
  }, [entityType, showHistory]);

  // Handle outside clicks to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedSuggestion(-1);

    // Show suggestions if input has value
    if (value.trim().length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSearch = (searchQuery: string = query) => {
    if (searchQuery.trim()) {
      saveSearchHistory(searchQuery, entityType);
      onSearch(searchQuery);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(selectedSuggestion + 1, history.length - 1);
      setSelectedSuggestion(nextIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = Math.max(selectedSuggestion - 1, -1);
      setSelectedSuggestion(prevIndex);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleClear = () => {
    setQuery('');
    setShowSuggestions(false);
    setSelectedSuggestion(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleClearHistory = () => {
    clearSearchHistory(entityType);
    setHistory([]);
  };

  const isCodeQuery = isCodeLikePattern(query);
  const relevantHistory = query.trim() 
    ? history.filter(h => h.toLowerCase().includes(query.toLowerCase()))
    : history;

  return (
    <div ref={searchRef} style={{ position: 'relative', width: '100%' }}>
      {/* Search Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--bg-border)',
        borderRadius: 8,
        padding: '10px 14px',
        position: 'relative'
      }}>
        <Search size={16} color={isCodeQuery ? '#6366f1' : 'var(--text-muted)'} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setShowSuggestions(true)}
          placeholder={placeholder || `Search by code (e.g., ${config.codeFormat}) or name...`}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            fontSize: 14,
            outline: 'none',
            color: 'var(--text-primary)'
          }}
          disabled={loading}
        />
        
        {loading ? (
          <div style={{ animation: 'spin 1s linear infinite' }}>
            ⏳
          </div>
        ) : query && (
          <button
            onClick={handleClear}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 0,
              display: 'flex',
              alignItems: 'center'
            }}
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Search Tips */}
      {query && (
        <div style={{
          marginTop: 6,
          fontSize: 11,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          {isCodeQuery && (
            <>
              <Zap size={12} color="#6366f1" />
              <span>Searching by code</span>
            </>
          )}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 6,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--bg-border)',
          borderRadius: 8,
          zIndex: 1000,
          maxHeight: 300,
          overflowY: 'auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {relevantHistory.length > 0 ? (
            <>
              {/* History Section */}
              <div style={{ padding: '8px 0' }}>
                <div style={{
                  padding: '8px 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  borderBottom: '1px solid var(--bg-border)'
                }}>
                  <Clock size={12} style={{ display: 'inline', marginRight: 6 }} />
                  Recent Searches
                </div>

                {relevantHistory.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    onClick={() => handleSuggestionClick(item)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      background: selectedSuggestion === index ? 'rgba(99,102,241,0.1)' : 'transparent',
                      borderLeft: selectedSuggestion === index ? '3px solid #6366f1' : '3px solid transparent',
                      borderBottom: '1px solid var(--bg-border)',
                      transition: 'background 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                    onMouseEnter={() => setSelectedSuggestion(index)}
                  >
                    <Clock size={12} color="var(--text-muted)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {item}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {isCodeLikePattern(item) ? 'Code search' : 'Text search'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clear History */}
              <div style={{
                padding: '8px 12px',
                borderTop: '1px solid var(--bg-border)',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={handleClearHistory}
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 4,
                    transition: 'background 0.2s',
                    textDecoration: 'underline'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  Clear history
                </button>
              </div>
            </>
          ) : (
            <div style={{
              padding: 16,
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 13
            }}>
              No search history
            </div>
          )}
        </div>
      )}
    </div>
  );
}
