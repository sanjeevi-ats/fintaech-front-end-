'use client';
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DashboardSummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    percentage: number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
  loading?: boolean;
}

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  primary: { bg: 'rgba(99,102,241,0.08)', text: '#6366f1', border: 'rgba(99,102,241,0.2)' },
  success: { bg: 'rgba(16,185,129,0.08)', text: '#10b981', border: 'rgba(16,185,129,0.2)' },
  warning: { bg: 'rgba(245,158,11,0.08)', text: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  danger: { bg: 'rgba(244,63,94,0.08)', text: '#f43f5e', border: 'rgba(244,63,94,0.2)' },
  info: { bg: 'rgba(6,182,212,0.08)', text: '#06b6d4', border: 'rgba(6,182,212,0.2)' },
};

export default function DashboardSummaryCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'primary',
  onClick,
  loading = false,
}: DashboardSummaryCardProps) {
  const colorScheme = colorMap[color];
  const trendColor = trend?.direction === 'up' ? '#10b981' : trend?.direction === 'down' ? '#f43f5e' : '#9ca3af';

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-primary)',
        border: `1px solid var(--bg-border)`,
        borderRadius: 12,
        padding: 16,
        cursor: onClick ? 'pointer' : 'default',
        transition: onClick ? 'all 0.2s' : 'none',
      }}
      onMouseEnter={e => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={e => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        }
      }}
    >
      {/* Header with icon and trend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon && (
            <div style={{ width: 40, height: 40, borderRadius: 8, background: colorScheme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colorScheme.text }}>
              {icon}
            </div>
          )}
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {title}
            </div>
          </div>
        </div>
        {trend && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 700,
              color: trendColor,
              background: `${trendColor}15`,
              padding: '4px 8px',
              borderRadius: 6,
            }}
          >
            {trend.direction === 'up' && <TrendingUp size={14} />}
            {trend.direction === 'down' && <TrendingDown size={14} />}
            {trend.direction === 'neutral' && <Minus size={14} />}
            {trend.percentage > 0 ? '+' : ''}{trend.percentage}%
          </div>
        )}
      </div>

      {/* Value */}
      <div style={{ marginBottom: subtitle ? 8 : 0 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
          {loading ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading...</div>
          ) : (
            value
          )}
        </div>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
