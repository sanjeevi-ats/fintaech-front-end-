'use client';
import React, { useState } from 'react';
import { UserCheck, Edit, Trash2, Plus, Shield, Check, X } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/utils';

const permissions = [
  { key: 'view_capital', label: 'View Capital' },
  { key: 'approve_loan', label: 'Approve Loan' },
  { key: 'disburse_loan', label: 'Disburse Loan' },
  { key: 'approve_expense', label: 'Approve Expense' },
  { key: 'view_audit', label: 'View Audit Logs' },
  { key: 'manage_roles', label: 'Manage Roles' },
  { key: 'day_end_close', label: 'Day-End Close' },
  { key: 'create_journal', label: 'Create Journal Entry' },
  { key: 'mark_legal', label: 'Mark Legal Flag' },
  { key: 'export_reports', label: 'Export Reports' },
];

const rolePermissions: Record<string, Record<string, boolean>> = {
  super_admin: Object.fromEntries(permissions.map(p => [p.key, true])),
  branch_manager: { view_capital: true, approve_loan: true, disburse_loan: true, approve_expense: false, view_audit: true, manage_roles: false, day_end_close: true, create_journal: true, mark_legal: true, export_reports: true },
  accountant: { view_capital: false, approve_loan: false, disburse_loan: false, approve_expense: true, view_audit: false, manage_roles: false, day_end_close: true, create_journal: true, mark_legal: false, export_reports: true },
  loan_officer: { view_capital: false, approve_loan: true, disburse_loan: false, approve_expense: false, view_audit: false, manage_roles: false, day_end_close: false, create_journal: false, mark_legal: false, export_reports: false },
  collection_officer: { view_capital: false, approve_loan: false, disburse_loan: false, approve_expense: false, view_audit: false, manage_roles: false, day_end_close: false, create_journal: false, mark_legal: false, export_reports: false },
};

const users = [
  { id: 'U001', name: 'Swetha Nair', role: 'branch_manager', branch: 'Mumbai - Andheri', status: 'active', lastLogin: '2024-03-13 09:12' },
  { id: 'U002', name: 'Ramesh CO', role: 'collection_officer', branch: 'Mumbai - Andheri', status: 'active', lastLogin: '2024-03-13 08:30' },
  { id: 'U003', name: 'Priya CO', role: 'collection_officer', branch: 'Mumbai - Andheri', status: 'active', lastLogin: '2024-03-13 08:45' },
  { id: 'U004', name: 'Ravi Accountant', role: 'accountant', branch: 'Mumbai - Andheri', status: 'active', lastLogin: '2024-03-13 09:00' },
  { id: 'U005', name: 'Kiran LO', role: 'loan_officer', branch: 'Delhi - Rohini', status: 'inactive', lastLogin: '2024-03-10 14:20' },
];

export default function RBACPage() {
  const [selectedRole, setSelectedRole] = useState('branch_manager');
  const [perms, setPerms] = useState(rolePermissions);

  const toggle = (role: string, perm: string) => {
    if (role === 'super_admin') return;
    setPerms(prev => ({
      ...prev,
      [role]: { ...prev[role], [perm]: !prev[role][perm] }
    }));
  };

  return (
    <div className="fade-in-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={20} color="#6366f1" /> Role-Based Access Control
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Dynamic permission management for all roles</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Permission Matrix */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Permission Matrix</div>
          {/* Role selector */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {Object.keys(rolePermissions).map(role => (
              <button key={role} className={`btn btn-sm ${selectedRole === role ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedRole(role)}>
                {ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {permissions.map(p => (
              <div key={p.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.label}</span>
                <div
                  onClick={() => toggle(selectedRole, p.key)}
                  style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: perms[selectedRole]?.[p.key] ? '#10b981' : 'var(--bg-border)',
                    cursor: selectedRole === 'super_admin' ? 'not-allowed' : 'pointer',
                    position: 'relative', transition: 'background 0.2s',
                    opacity: selectedRole === 'super_admin' ? 0.7 : 1,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3, left: perms[selectedRole]?.[p.key] ? 23 : 3,
                    width: 18, height: 18, borderRadius: 9, background: 'white',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </div>
              </div>
            ))}
          </div>
          {selectedRole === 'super_admin' && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, textAlign: 'center' }}>Super Admin has all permissions (locked)</div>
          )}
        </div>

        {/* User Management */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>User Accounts</div>
            <button className="btn btn-primary btn-sm"><Plus size={12} /> Add User</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {users.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 10 }}>
                <div className="avatar" style={{ width: 34, height: 34, background: 'var(--grad-primary)', color: 'white', fontSize: 11, flexShrink: 0 }}>
                  {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ROLE_LABELS[u.role as keyof typeof ROLE_LABELS]} · {u.branch}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Last login: {u.lastLogin}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                  <span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-gray'}`}>{u.status}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-secondary btn-icon btn-sm"><Edit size={11} /></button>
                    <button className="btn btn-secondary btn-icon btn-sm" style={{ color: '#f87171' }}><Trash2 size={11} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
