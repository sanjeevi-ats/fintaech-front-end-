'use client';
import React, { useState, useEffect } from 'react';
import { Settings, GripVertical, Eye, EyeOff, RotateCcw, Save } from 'lucide-react';

interface Widget {
  id: string;
  name: string;
  visible: boolean;
  order: number;
}

interface DashboardCustomizerProps {
  userId?: string;
  onClose?: () => void;
  defaultWidgets?: Widget[];
}

export default function DashboardCustomizer({
  userId = 'user-1',
  onClose,
  defaultWidgets = [
    { id: 'kpi-cards', name: 'KPI Summary Cards', visible: true, order: 1 },
    { id: 'charts', name: 'Performance Charts', visible: true, order: 2 },
    { id: 'analytics', name: 'Analytics Section', visible: true, order: 3 },
    { id: 'tables', name: 'Data Tables', visible: true, order: 4 },
    { id: 'alerts', name: 'Alerts & Notifications', visible: true, order: 5 },
  ],
}: DashboardCustomizerProps) {
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<'executive' | 'operations' | 'full'>('full');
  const [saved, setSaved] = useState(false);

  // Load saved preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`dashboard-${userId}-widgets`);
    const savedOrder = localStorage.getItem(`dashboard-${userId}-layout`);
    
    if (saved) {
      try {
        setWidgets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved widgets:', e);
      }
    }

    if (savedOrder) {
      try {
        const order = JSON.parse(savedOrder);
        setWidgets(prev => [...prev].sort((a, b) => {
          return (order[a.id] || 999) - (order[b.id] || 999);
        }));
      } catch (e) {
        console.error('Failed to load widget order:', e);
      }
    }
  }, [userId]);

  const toggleWidget = (id: string) => {
    setWidgets(prev =>
      prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w)
    );
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-elevated)';
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
  };

  const handleDrop = (targetId: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';

    if (!draggedId || draggedId === targetId) return;

    const draggedWidget = widgets.find(w => w.id === draggedId);
    const targetWidget = widgets.find(w => w.id === targetId);

    if (!draggedWidget || !targetWidget) return;

    // Swap order
    const newWidgets = widgets.map(w => {
      if (w.id === draggedId) return { ...w, order: targetWidget.order };
      if (w.id === targetId) return { ...w, order: draggedWidget.order };
      return w;
    });

    setWidgets(newWidgets.sort((a, b) => a.order - b.order));
    setDraggedId(null);
  };

  const applyPreset = (preset: typeof selectedPreset) => {
    let updated: Widget[];

    switch (preset) {
      case 'executive':
        updated = widgets.map(w => ({
          ...w,
          visible:
            w.id === 'kpi-cards' ||
            w.id === 'charts' ||
            w.id === 'analytics',
        }));
        break;
      case 'operations':
        updated = widgets.map(w => ({
          ...w,
          visible: w.id !== 'analytics',
        }));
        break;
      case 'full':
      default:
        updated = widgets.map(w => ({ ...w, visible: true }));
        break;
    }

    setWidgets(updated);
    setSelectedPreset(preset);
  };

  const resetToDefaults = () => {
    setWidgets(defaultWidgets);
    setSelectedPreset('full');
    localStorage.removeItem(`dashboard-${userId}-widgets`);
    localStorage.removeItem(`dashboard-${userId}-layout`);
    setSaved(false);
  };

  const savePreferences = () => {
    // Save widget visibility
    localStorage.setItem(`dashboard-${userId}-widgets`, JSON.stringify(widgets));

    // Save widget order
    const order: Record<string, number> = {};
    widgets.forEach((w, idx) => {
      order[w.id] = idx;
    });
    localStorage.setItem(`dashboard-${userId}-layout`, JSON.stringify(order));

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: 12,
        border: '1px solid var(--bg-border)',
        padding: 24,
        maxWidth: 500,
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Settings size={24} color="#6366f1" />
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              Customize Dashboard
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Choose what to display
            </p>
          </div>
        </div>

        {/* Presets */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Quick Presets
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['executive', 'operations', 'full'] as const).map(preset => (
              <button
                key={preset}
                onClick={() => applyPreset(preset)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: selectedPreset === preset ? '2px solid #6366f1' : '1px solid var(--bg-border)',
                  background: selectedPreset === preset ? 'rgba(99,102,241,0.1)' : 'transparent',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  if (selectedPreset !== preset) {
                    (e.target as HTMLElement).style.background = 'var(--bg-elevated)';
                  }
                }}
                onMouseLeave={e => {
                  if (selectedPreset !== preset) {
                    (e.target as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                {preset === 'executive' ? '👔 Executive' : preset === 'operations' ? '⚙️ Operations' : '📊 Full'}
              </button>
            ))}
          </div>
        </div>

        {/* Widgets */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
            Dashboard Widgets
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {widgets.map((widget, idx) => (
              <div
                key={widget.id}
                draggable
                onDragStart={() => handleDragStart(widget.id)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(widget.id, e)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 8,
                  border: '1px solid var(--bg-border)',
                  cursor: 'grab',
                  transition: 'all 0.2s',
                  opacity: widget.visible ? 1 : 0.6,
                }}
              >
                <GripVertical size={16} color="var(--text-muted)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {widget.name}
                  </div>
                </div>
                <button
                  onClick={() => toggleWidget(widget.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    color: widget.visible ? '#10b981' : 'var(--text-muted)',
                  }}
                >
                  {widget.visible ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOff size={18} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Success message */}
        {saved && (
          <div style={{
            padding: '10px 12px',
            background: 'rgba(16,185,129,0.1)',
            borderRadius: 8,
            border: '1px solid #10b981',
            color: '#10b981',
            fontSize: 12,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span>✓</span>
            Preferences saved successfully
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={resetToDefaults}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: '1px solid var(--bg-border)',
              background: 'transparent',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            onClick={savePreferences}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: '#6366f1',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#4f46e5')}
            onMouseLeave={e => (e.currentTarget.style.background = '#6366f1')}
          >
            <Save size={14} />
            Save & Close
          </button>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              marginTop: 12,
              width: '100%',
              padding: '10px 16px',
              background: 'transparent',
              border: '1px solid var(--bg-border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
