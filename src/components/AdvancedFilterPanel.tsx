'use client';
import React, { useState } from 'react';
import { Calendar, Filter, X, RotateCcw, ChevronDown } from 'lucide-react';
import {
  StatusFilter,
  DateRangeFilter,
  AmountRangeFilter,
  EntityType,
  getStatusOptions,
  dateRangePresets,
  createFilterSummary,
} from '@/lib/filterUtils';

interface AdvancedFilterPanelProps {
  entityType: EntityType;
  onFilterChange: (filters: {
    status?: StatusFilter;
    dateRange?: DateRangeFilter;
    amountRange?: AmountRangeFilter;
  }) => void;
  showDateFilter?: boolean;
  showAmountFilter?: boolean;
  dateField?: string;
  amountField?: string;
}

export default function AdvancedFilterPanel({
  entityType,
  onFilterChange,
  showDateFilter = true,
  showAmountFilter = true,
  dateField = 'createdAt',
  amountField = 'totalAmount',
}: AdvancedFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [datePreset, setDatePreset] = useState<string>('');

  const statusOptions = getStatusOptions(entityType);

  const handleStatusToggle = (status: string) => {
    const updated = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status];
    setSelectedStatuses(updated);
    applyFilters(updated, { startDate, endDate }, { minAmount, maxAmount });
  };

  const handleDatePreset = (preset: keyof typeof dateRangePresets) => {
    const range = dateRangePresets[preset]();
    const start = range.startDate ? new Date(range.startDate).toISOString().split('T')[0] : '';
    const end = range.endDate ? new Date(range.endDate).toISOString().split('T')[0] : '';
    setStartDate(start);
    setEndDate(end);
    setDatePreset(preset);
    applyFilters(selectedStatuses, { startDate: start, endDate: end }, { minAmount, maxAmount });
  };

  const handleDateChange = () => {
    setDatePreset('');
    applyFilters(selectedStatuses, { startDate, endDate }, { minAmount, maxAmount });
  };

  const handleAmountChange = () => {
    applyFilters(selectedStatuses, { startDate, endDate }, { minAmount, maxAmount });
  };

  const applyFilters = (
    statuses: string[],
    dateRange: { startDate: string; endDate: string },
    amountRange: { minAmount: string; maxAmount: string }
  ) => {
    onFilterChange({
      status: statuses.length > 0 ? { statuses } : undefined,
      dateRange:
        dateRange.startDate || dateRange.endDate
          ? {
              startDate: dateRange.startDate,
              endDate: dateRange.endDate,
            }
          : undefined,
      amountRange:
        amountRange.minAmount || amountRange.maxAmount
          ? {
              minAmount: amountRange.minAmount ? parseFloat(amountRange.minAmount) * 100 : undefined,
              maxAmount: amountRange.maxAmount ? parseFloat(amountRange.maxAmount) * 100 : undefined,
            }
          : undefined,
    });
  };

  const handleReset = () => {
    setSelectedStatuses([]);
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setDatePreset('');
    onFilterChange({});
  };

  const filterSummary = createFilterSummary({
    status: selectedStatuses.length > 0 ? { statuses: selectedStatuses } : undefined,
    dateRange: startDate || endDate ? { startDate, endDate } : undefined,
    amountRange: minAmount || maxAmount ? { minAmount: parseFloat(minAmount || '0') * 100, maxAmount: parseFloat(maxAmount || '0') * 100 } : undefined,
  });

  const hasActiveFilters = selectedStatuses.length > 0 || startDate || endDate || minAmount || maxAmount;

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`btn btn-sm ${hasActiveFilters ? 'btn-primary' : 'btn-secondary'}`}
        style={{ gap: 8, display: 'inline-flex', alignItems: 'center' }}
      >
        <Filter size={14} />
        Filters {hasActiveFilters && <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.3)', padding: '2px 6px', borderRadius: 4 }}>{filterSummary.length}</span>}
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div
          className="card"
          style={{
            marginTop: 12,
            padding: 16,
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {/* Status Filter */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>
              Status
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {statusOptions.map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusToggle(status)}
                  className={`btn btn-sm ${selectedStatuses.includes(status) ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    textTransform: 'capitalize',
                    fontSize: 12,
                    padding: '6px 12px',
                  }}
                >
                  {status.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          {showDateFilter && (
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--bg-border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} />
                Date Range
              </div>

              {/* Date Presets */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
                  Quick Select:
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(['today', 'thisWeek', 'thisMonth', 'lastMonth', 'last90Days', 'lastYear'] as const).map(
                    preset => (
                      <button
                        key={preset}
                        onClick={() => handleDatePreset(preset)}
                        className={`btn btn-sm ${datePreset === preset ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          fontSize: 11,
                          padding: '4px 10px',
                          textTransform: 'capitalize',
                        }}
                      >
                        {preset.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Custom Date Range */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                    From Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => {
                      setStartDate(e.target.value);
                      setDatePreset('');
                      handleDateChange();
                    }}
                    className="input"
                    style={{ fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                    To Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => {
                      setEndDate(e.target.value);
                      setDatePreset('');
                      handleDateChange();
                    }}
                    className="input"
                    style={{ fontSize: 12 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Amount Range Filter */}
          {showAmountFilter && (
            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--bg-border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>
                Amount Range (₹)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                    Min Amount
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={minAmount}
                    onChange={e => {
                      setMinAmount(e.target.value);
                      handleAmountChange();
                    }}
                    className="input"
                    style={{ fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                    Max Amount
                  </label>
                  <input
                    type="number"
                    placeholder="999999"
                    value={maxAmount}
                    onChange={e => {
                      setMaxAmount(e.target.value);
                      handleAmountChange();
                    }}
                    className="input"
                    style={{ fontSize: 12 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Filter Summary */}
          {hasActiveFilters && (
            <div style={{ background: 'rgba(99,102,241,0.08)', padding: 12, borderRadius: 8, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Active Filters:
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {filterSummary.map((summary, i) => (
                  <span
                    key={i}
                    style={{
                      background: 'var(--bg-border)',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {summary}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={handleReset}
              className="btn btn-secondary btn-sm"
              style={{ gap: 4, display: 'inline-flex', alignItems: 'center' }}
              disabled={!hasActiveFilters}
            >
              <RotateCcw size={12} /> Clear Filters
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="btn btn-primary btn-sm"
              style={{ gap: 4, display: 'inline-flex', alignItems: 'center' }}
            >
              <X size={12} /> Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
