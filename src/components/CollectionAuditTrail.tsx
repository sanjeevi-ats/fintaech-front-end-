'use client';
import React, { useState, useEffect } from 'react';
import { History, User, Calendar, DollarSign, FileText, Loader2, AlertCircle } from 'lucide-react';
import { collectionService } from '@/services/collectionService';
import { auditService, AuditLog } from '@/services/auditService';

interface CollectionAuditTrailProps {
  installmentId: string;
  loanCaseId: string;
  onClose: () => void;
}

interface CollectionAuditEntry {
  id: string;
  installmentId: string;
  action: string;
  oldAmount: number;
  newAmount: number;
  collectionDate: string;
  paymentMode: string;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  remarks?: string;
}

export default function CollectionAuditTrail({ installmentId, loanCaseId, onClose }: CollectionAuditTrailProps) {
  const [auditLogs, setAuditLogs] = useState<CollectionAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditTrail();
  }, [installmentId]);

  const fetchAuditTrail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get collection-specific history first
      try {
        const collectionHistory = await collectionService.getCollectionHistory(installmentId);
        setAuditLogs(collectionHistory);
      } catch (collectionError) {
        // Fallback to general audit service
        console.warn('Collection history endpoint failed, trying general audit:', collectionError);
        const entityHistory = await auditService.getEntityHistory('installment', installmentId);
        
        // Transform general audit logs to collection audit format
        const transformedLogs = entityHistory.changes.map((log: AuditLog) => ({
          id: log.id,
          installmentId: installmentId,
          action: log.action,
          oldAmount: log.oldValues?.collectedAmount || 0,
          newAmount: log.newValues?.collectedAmount || 0,
          collectionDate: log.newValues?.collectedDate || new Date().toISOString().split('T')[0],
          paymentMode: log.newValues?.paymentMode || 'cash',
          userId: log.userId,
          userName: log.userName,
          userRole: 'unknown',
          timestamp: log.timestamp,
          remarks: log.newValues?.remarks
        }));
        
        setAuditLogs(transformedLogs);
      }
    } catch (err: any) {
      console.error('Failed to fetch audit trail:', err);
      setError('Failed to load audit trail. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return `₹${(amount / 100).toLocaleString()}`;
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'collection_update':
        return '#10b981';
      case 'update':
        return '#f59e0b';
      case 'delete':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'collection_update':
        return <DollarSign size={14} />;
      case 'update':
        return <FileText size={14} />;
      default:
        return <History size={14} />;
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      background: 'rgba(0,0,0,0.75)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 9999 
    }}>
      <div className="card" style={{ width: 700, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={16} color="#6366f1" />
              Collection Audit Trail
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Installment: {installmentId.slice(0, 8)}... • Loan: {loanCaseId.slice(0, 8)}...
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-muted)', 
              cursor: 'pointer', 
              fontSize: 18 
            }}
          >
            ×
          </button>
        </div>

        {loading && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: 40 
          }}>
            <Loader2 size={24} className="animate-spin" color="#6366f1" />
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
              Loading audit trail...
            </p>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 20 }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {auditLogs.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: 40, 
                color: 'var(--text-muted)' 
              }}>
                <History size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                <p>No audit trail found for this installment.</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>
                  Collection updates will appear here once recorded.
                </p>
              </div>
            ) : (
              <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {auditLogs.map((log, index) => (
                  <div 
                    key={log.id} 
                    style={{ 
                      display: 'flex', 
                      gap: 12, 
                      padding: 16,
                      borderBottom: index < auditLogs.length - 1 ? '1px solid var(--bg-border)' : 'none'
                    }}
                  >
                    {/* Timeline indicator */}
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      minWidth: 24
                    }}>
                      <div style={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '50%', 
                        background: getActionColor(log.action),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        {getActionIcon(log.action)}
                      </div>
                      {index < auditLogs.length - 1 && (
                        <div style={{ 
                          width: 2, 
                          height: 40, 
                          background: 'var(--bg-border)',
                          marginTop: 8
                        }} />
                      )}
                    </div>

                    {/* Audit details */}
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: 8
                      }}>
                        <div>
                          <div style={{ 
                            fontSize: 14, 
                            fontWeight: 600, 
                            color: 'var(--text-primary)',
                            marginBottom: 2
                          }}>
                            {log.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          <div style={{ 
                            fontSize: 12, 
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <User size={10} />
                            {log.userName} ({log.userRole})
                          </div>
                        </div>
                        <div style={{ 
                          fontSize: 11, 
                          color: 'var(--text-muted)',
                          textAlign: 'right'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={10} />
                            {formatDateTime(log.timestamp)}
                          </div>
                        </div>
                      </div>

                      {/* Amount change details */}
                      <div style={{ 
                        background: 'var(--bg-elevated)', 
                        padding: 12, 
                        borderRadius: 6,
                        marginBottom: 8
                      }}>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr 1fr', 
                          gap: 12,
                          fontSize: 12
                        }}>
                          <div>
                            <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Previous</div>
                            <div style={{ fontWeight: 600 }}>{formatAmount(log.oldAmount)}</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Updated</div>
                            <div style={{ fontWeight: 600, color: '#10b981' }}>
                              {formatAmount(log.newAmount)}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Mode</div>
                            <div style={{ fontWeight: 600 }}>
                              {log.paymentMode.replace('_', ' ').toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Collection date */}
                      <div style={{ 
                        fontSize: 12, 
                        color: 'var(--text-muted)',
                        marginBottom: 8
                      }}>
                        Collection Date: <span style={{ fontWeight: 600 }}>
                          {new Date(log.collectionDate).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Remarks */}
                      {log.remarks && (
                        <div style={{ 
                          fontSize: 12, 
                          color: 'var(--text-muted)',
                          fontStyle: 'italic',
                          background: 'rgba(99,102,241,0.05)',
                          padding: 8,
                          borderRadius: 4,
                          borderLeft: '3px solid #6366f1'
                        }}>
                          "{log.remarks}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div style={{ 
          marginTop: 20, 
          padding: 12, 
          background: 'var(--bg-elevated)', 
          borderRadius: 6,
          fontSize: 11,
          color: 'var(--text-muted)',
          textAlign: 'center'
        }}>
          All collection updates are automatically logged for audit and compliance purposes.
        </div>
      </div>
    </div>
  );
}