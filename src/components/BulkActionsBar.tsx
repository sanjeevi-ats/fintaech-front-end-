'use client';
import React, { useState } from 'react';
import { Trash2, Download, Send, Check, X, Loader2, AlertTriangle } from 'lucide-react';
import {
  SelectionState,
  getSelectedIds,
  getSelectedCount,
  createConfirmationMessage,
  validateBulkOperation,
} from '@/lib/bulkOperationsUtils';

interface BulkActionsBarProps {
  selectionState: SelectionState;
  onClearSelection: () => void;
  onDelete?: (ids: string[]) => Promise<void>;
  onExport?: (ids: string[]) => Promise<void>;
  onUpdateStatus?: (ids: string[], newStatus: string) => Promise<void>;
  onSendNotification?: (ids: string[]) => Promise<void>;
  statusOptions?: string[];
  loading?: boolean;
  showDeleteButton?: boolean;
  showExportButton?: boolean;
  showNotificationButton?: boolean;
}

export default function BulkActionsBar({
  selectionState,
  onClearSelection,
  onDelete,
  onExport,
  onUpdateStatus,
  onSendNotification,
  statusOptions,
  loading = false,
  showDeleteButton = false,
  showExportButton = true,
  showNotificationButton = false,
}: BulkActionsBarProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedCount = getSelectedCount(selectionState);
  const selectedIds = getSelectedIds(selectionState);
  const isVisible = selectedCount > 0;

  if (!isVisible) return null;

  const handleAction = async (action: () => Promise<void>, actionName: string) => {
    setError(null);
    setSuccess(null);
    setIsProcessing(true);

    try {
      await action();
      setSuccess(`✓ ${actionName} completed for ${selectedCount} item${selectedCount > 1 ? 's' : ''}`);
    } catch (err: any) {
      setError(`Failed to ${actionName.toLowerCase()}: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    const validation = validateBulkOperation(selectionState.selectedIds);
    if (!validation.valid) {
      setError(validation.error || 'Invalid selection');
      return;
    }

    if (!window.confirm(createConfirmationMessage(selectedCount, 'delete'))) {
      return;
    }

    if (onDelete) {
      await handleAction(() => onDelete(selectedIds), 'Delete');
      onClearSelection();
    }
  };

  const handleExport = async () => {
    if (onExport) {
      await handleAction(() => onExport(selectedIds), 'Export');
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (onUpdateStatus) {
      await handleAction(() => onUpdateStatus(selectedIds, newStatus), 'Status update');
      setActiveDropdown(null);
      onClearSelection();
    }
  };

  const handleSendNotification = async () => {
    if (!window.confirm(createConfirmationMessage(selectedCount, 'send'))) {
      return;
    }

    if (onSendNotification) {
      await handleAction(() => onSendNotification(selectedIds), 'Send notifications');
      onClearSelection();
    }
  };

  return (
    <div
      style={{
        background: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      {/* Selection Summary */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
          {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {Math.round((selectedCount / selectionState.totalCount) * 100)}% of {selectionState.totalCount}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div style={{ flex: 1, padding: '8px 12px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: 8, fontSize: 12, color: '#f43f5e', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {success && (
        <div style={{ flex: 1, padding: '8px 12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8, fontSize: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Check size={14} />
          {success}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Status Update */}
        {onUpdateStatus && statusOptions && statusOptions.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
              disabled={isProcessing}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Update Status {isProcessing && <Loader2 size={12} className="animate-spin" />}
            </button>
            {activeDropdown === 'status' && (
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
                {statusOptions.map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(status)}
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
                    {status.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Export */}
        {showExportButton && onExport && (
          <button
            className="btn btn-sm btn-secondary"
            onClick={handleExport}
            disabled={isProcessing}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Download size={14} />
            {isProcessing ? <Loader2 size={12} className="animate-spin" /> : 'Export'}
          </button>
        )}

        {/* Send Notification */}
        {showNotificationButton && onSendNotification && (
          <button
            className="btn btn-sm btn-secondary"
            onClick={handleSendNotification}
            disabled={isProcessing}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Send size={14} />
            {isProcessing ? <Loader2 size={12} className="animate-spin" /> : 'Notify'}
          </button>
        )}

        {/* Delete */}
        {showDeleteButton && onDelete && (
          <button
            className="btn btn-sm"
            onClick={handleDelete}
            disabled={isProcessing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(244, 63, 94, 0.1)',
              color: '#f43f5e',
              border: '1px solid rgba(244, 63, 94, 0.2)',
            }}
          >
            <Trash2 size={14} />
            {isProcessing ? <Loader2 size={12} className="animate-spin" /> : 'Delete'}
          </button>
        )}

        {/* Clear Selection */}
        <button
          className="btn btn-sm btn-secondary"
          onClick={onClearSelection}
          disabled={isProcessing}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <X size={14} /> Clear
        </button>
      </div>
    </div>
  );
}
