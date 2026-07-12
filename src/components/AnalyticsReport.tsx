'use client';
import React, { useState } from 'react';
import { Download, Filter, Calendar, BarChart3 } from 'lucide-react';
import { reportPeriods, ReportPeriod, CategorizedData } from '@/lib/reportUtils';

interface AnalyticsReportProps {
  title: string;
  data: CategorizedData[];
  selectedPeriod?: ReportPeriod;
  onPeriodChange?: (period: ReportPeriod) => void;
  onExport?: (data: CategorizedData[]) => void;
  loading?: boolean;
}

export default function AnalyticsReport({
  title,
  data,
  selectedPeriod,
  onPeriodChange,
  onExport,
  loading = false,
}: AnalyticsReportProps) {
  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null);

  const handlePeriodSelect = (periodKey: keyof typeof reportPeriods) => {
    const period = reportPeriods[periodKey]();
    onPeriodChange?.(period);
    setExpandedDropdown(null);
  };

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="card" style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={18} color="#6366f1" />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Period Selector */}
          {onPeriodChange && (
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setExpandedDropdown(expandedDropdown === 'period' ? null : 'period')}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Calendar size={14} />
                {selectedPeriod?.label || 'Select Period'}
              </button>
              {expandedDropdown === 'period' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--bg-border)',
                    borderRadius: 8,
                    marginTop: 4,
                    minWidth: 160,
                    zIndex: 100,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  {(['today', 'thisWeek', 'thisMonth', 'last30Days', 'last90Days', 'thisYear'] as const).map(period => (
                    <button
                      key={period}
                      onClick={() => handlePeriodSelect(period)}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '8px 12px',
                        textAlign: 'left',
                        fontSize: 12,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        borderBottom: '1px solid var(--bg-border)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => ((e.target as HTMLElement).style.background = 'var(--bg-elevated)')}
                      onMouseLeave={e => ((e.target as HTMLElement).style.background = 'transparent')}
                    >
                      {reportPeriods[period]().label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Export Button */}
          {onExport && (
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => onExport(data)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={14} /> Export
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          Loading report data...
        </div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          No data available for this period
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--bg-border)' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                  Category
                </th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                  Count
                </th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                  Percentage
                </th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                  Distribution
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  <td style={{ padding: '12px 8px', fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                    {item.category}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#6366f1' }}>
                    {item.value}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#10b981' }}>
                    {item.percentage}%
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <div
                      style={{
                        width: `${item.percentage}%`,
                        height: 24,
                        background: 'rgba(99, 102, 241, 0.2)',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#6366f1',
                        minWidth: item.percentage > 5 ? 'auto' : 0,
                      }}
                    >
                      {item.percentage > 10 && `${item.percentage}%`}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary Row */}
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              borderRadius: 8,
              padding: '12px 8px',
              marginTop: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total</span>
            <span style={{ fontWeight: 800, color: '#6366f1', fontSize: 16 }}>{totalValue}</span>
          </div>
        </div>
      )}
    </div>
  );
}
