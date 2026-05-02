'use client';
import React, { useState } from 'react';
import { Shield, Eye, Search, Filter } from 'lucide-react';
import { mockAuditLogs } from '@/lib/mockData';

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = mockAuditLogs.filter(log =>
    log.user.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.entityId.toLowerCase().includes(search.toLowerCase())
  );

  const actionColors: Record<string, string> = {
    LOAN_DISBURSED: 'badge-info',
    PAYMENT_COLLECTED: 'badge-success',
    ROLE_MODIFIED: 'badge-warning',
    EXPENSE_APPROVED: 'badge-purple',
    LOAN_REJECTED: 'badge-danger',
    LOGIN: 'badge-gray',
  };

  return (
    <div className="fade-in-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={20} color="#6366f1" /> Centralized Audit Log
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>100% traceability — Every state change logged with Before/After data</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Events Today', val: '1,247', color: '#6366f1' },
          { label: 'Financial Events', val: '342', color: '#10b981' },
          { label: 'Security Events', val: '18', color: '#f59e0b' },
          { label: 'Failed Attempts', val: '3', color: '#ef4444' },
        ].map((item, i) => (
          <div key={i} className="card" style={{ flex: 1, padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user, action, or entity ID..." style={{ paddingLeft: 30, height: 36 }} />
        </div>
        <button className="btn btn-secondary btn-sm"><Filter size={12} /> Filter</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ padding: '14px 16px' }}>Timestamp</th>
              <th>User</th>
              <th>Role</th>
              <th>Action</th>
              <th>Entity</th>
              <th>IP Address</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => (
              <React.Fragment key={log.id}>
                <tr onClick={() => setExpanded(expanded === log.id ? null : log.id)} style={{ cursor: 'pointer' }}>
                  <td style={{ paddingLeft: 16 }}>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--text-primary)' }}>{log.timestamp.replace('T', ' ')}</div>
                  </td>
                  <td className="primary">{log.user}</td>
                  <td><span className="badge badge-gray">{log.role}</span></td>
                  <td><span className={`badge ${actionColors[log.action] || 'badge-gray'}`}>{log.action}</span></td>
                  <td>
                    <div style={{ fontSize: 12 }}>{log.entity}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{log.entityId}</div>
                  </td>
                  <td className="mono" style={{ fontSize: 11 }}>{log.ip}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm"><Eye size={11} /> {expanded === log.id ? 'Hide' : 'Show'}</button>
                  </td>
                </tr>
                {expanded === log.id && (
                  <tr>
                    <td colSpan={7} style={{ paddingLeft: 16, paddingBottom: 14, background: 'var(--bg-elevated)' }}>
                      <div style={{ display: 'flex', gap: 20 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Before State</div>
                          <pre style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#f87171', fontFamily: 'JetBrains Mono, monospace' }}>
                            {JSON.stringify(JSON.parse(log.before), null, 2)}
                          </pre>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>After State</div>
                          <pre style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>
                            {JSON.stringify(JSON.parse(log.after), null, 2)}
                          </pre>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
