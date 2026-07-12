'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Search, Shield, Edit2, UserX, UserCheck, Loader2,
  AlertCircle, CheckCircle2, X, Eye, EyeOff, Filter, RefreshCw
} from 'lucide-react';
import { userService, User } from '@/services/userService';
import { branchService, Branch } from '@/services/branchService';

// ── Role definitions ──
const ROLES = [
  { value: 'super_admin', label: 'Super Admin', color: '#ef4444', desc: 'Full system access' },
  { value: 'branch_manager', label: 'Branch Manager', color: '#6366f1', desc: 'Branch management & approvals' },
  { value: 'loan_officer', label: 'Loan Officer', color: '#8b5cf6', desc: 'Loan processing & approvals' },
  { value: 'collection_officer', label: 'Collection Officer', color: '#f59e0b', desc: 'Collect payments & submit requests' },
  { value: 'accountant', label: 'Accountant', color: '#10b981', desc: 'Accounting & financial reports' },
  { value: 'partner', label: 'Partner', color: '#06b6d4', desc: 'Capital & equity management' },
  { value: 'recovery_specialist', label: 'Recovery Specialist', color: '#f97316', desc: 'Loan recovery & legal actions' },
  { value: 'agent', label: 'Collection Agent', color: '#84cc16', desc: 'Field agent for collections' },
  { value: 'customer', label: 'Customer', color: '#6b7280', desc: 'Customer portal access' },
];

const roleColor = (r: string) => ROLES.find(x => x.value === r)?.color || '#6b7280';
const roleLabel = (r: string) => ROLES.find(x => x.value === r)?.label || r;

const getRoleBadgeStyle = (role: string) => ({
  background: `${roleColor(role)}18`,
  color: roleColor(role),
  padding: '2px 8px',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
});

// ── Create Employee Modal ──
interface CreateEmployeeModalProps {
  branches: Branch[];
  onClose: () => void;
  onSuccess: (user: User) => void;
}

function CreateEmployeeModal({ branches, onClose, onSuccess }: CreateEmployeeModalProps) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'collection_officer', branchId: branches[0]?.id || ''
  });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.branchId) {
      setError('All fields are required');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const user = await userService.create({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        branchId: form.branchId,
        isActive: true,
      });
      onSuccess(user);
    } catch (e: any) {
      setError(e.message || 'Failed to create employee');
    } finally {
      setSaving(false);
    }
  };

  const selectedRole = ROLES.find(r => r.value === form.role);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div className="card" style={{ width: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} color="#6366f1" /> Create Employee
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Onboard a new team member</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20 }}>×</button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 16, borderRadius: 10 }}>
            <AlertCircle size={13} /><span>{error}</span>
          </div>
        )}

        {/* Role selector */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Role *</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {ROLES.filter(r => r.value !== 'customer').map(role => (
              <button
                key={role.value}
                onClick={() => setForm(p => ({ ...p, role: role.value }))}
                style={{
                  padding: '8px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                  border: `2px solid ${form.role === role.value ? role.color : 'var(--bg-border)'}`,
                  background: form.role === role.value ? `${role.color}10` : 'var(--bg-elevated)',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: form.role === role.value ? role.color : 'var(--text-secondary)' }}>
                  {role.label}
                </div>
              </button>
            ))}
          </div>
          {selectedRole && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, padding: '6px 10px', background: `${selectedRole.color}08`, borderRadius: 6, borderLeft: `3px solid ${selectedRole.color}` }}>
              {selectedRole.desc}
            </div>
          )}
        </div>

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Full Name *</label>
            <input className="form-control" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Enter full name" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Email *</label>
            <input className="form-control" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="employee@company.com" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Min. 6 characters"
                style={{ paddingRight: 40 }}
              />
              <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Branch *</label>
            <select
              className="form-control"
              value={form.branchId}
              onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))}
            >
              <option value="">— Select Branch —</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving}
            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {saving ? 'Creating...' : 'Create Employee'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function EmployeesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, branchData] = await Promise.all([
        userService.getAll(),
        branchService.getAll(),
      ]);
      setUsers(usersData);
      setBranches(branchData);
    } catch (e: any) {
      setError(e.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDeactivate = async (id: string, currentlyActive: boolean) => {
    const action = currentlyActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this employee?`)) return;
    try {
      if (currentlyActive) {
        // Use the dedicated deactivate PATCH endpoint
        await userService.deactivate(id);
      } else {
        // Reactivate: use update with isActive=true
        const user = users.find(u => u.id === id);
        if (user) await userService.update(id, { ...user, isActive: true });
      }
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !currentlyActive } : u));
      setSuccessMsg(`Employee ${currentlyActive ? 'deactivated' : 'activated'} successfully`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setError(e.message || `Failed to ${action} employee`);
    }
  };

  const handleCreateSuccess = (newUser: User) => {
    setUsers(prev => [newUser, ...prev]);
    setShowCreate(false);
    setSuccessMsg(`Employee created successfully!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.code || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Role counts
  const roleCounts = ROLES.map(r => ({
    ...r,
    count: users.filter(u => u.role === r.value).length
  })).filter(r => r.count > 0);

  return (
    <div className="fade-in-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={20} color="#6366f1" /> Employee Management
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Onboard and manage employees — {users.length} total
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Add Employee
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 16, borderRadius: 12 }}>
          <AlertCircle size={15} /><span>{error}</span>
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: 16, borderRadius: 12 }}>
          <CheckCircle2 size={15} /><span>{successMsg}</span>
        </div>
      )}

      {/* Role Summary Cards */}
      {roleCounts.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <div
            className="card"
            onClick={() => setRoleFilter('all')}
            style={{
              padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              border: roleFilter === 'all' ? '2px solid #6366f1' : '2px solid transparent',
              background: roleFilter === 'all' ? 'rgba(99,102,241,0.06)' : undefined
            }}
          >
            <Shield size={14} color="#6366f1" />
            <span style={{ fontSize: 13, fontWeight: 700 }}>All</span>
            <span style={{ fontSize: 12, background: 'rgba(99,102,241,0.12)', color: '#6366f1', padding: '0 6px', borderRadius: 4, fontWeight: 700 }}>
              {users.length}
            </span>
          </div>
          {roleCounts.map(role => (
            <div
              key={role.value}
              className="card"
              onClick={() => setRoleFilter(role.value)}
              style={{
                padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                border: roleFilter === role.value ? `2px solid ${role.color}` : '2px solid transparent',
                background: roleFilter === role.value ? `${role.color}08` : undefined
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: roleFilter === role.value ? role.color : 'var(--text-primary)' }}>
                {role.label}
              </span>
              <span style={{ fontSize: 12, background: `${role.color}20`, color: role.color, padding: '0 6px', borderRadius: 4, fontWeight: 700 }}>
                {role.count}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16, maxWidth: 400 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="form-control"
          style={{ paddingLeft: 36 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or code..."
        />
      </div>

      {/* Employee List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 size={28} className="animate-spin" color="#6366f1" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <Users size={40} color="var(--text-muted)" style={{ marginBottom: 14, opacity: 0.4 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
            {search || roleFilter !== 'all' ? 'No employees match your filters' : 'No employees yet'}
          </div>
          {!search && roleFilter === 'all' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)} style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Plus size={13} /> Add First Employee
            </button>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 16 }}>Employee</th>
                <th>Code</th>
                <th>Role</th>
                <th>Email</th>
                <th>Status</th>
                <th style={{ paddingRight: 16 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id}>
                  <td style={{ paddingLeft: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: `${roleColor(user.role)}20`,
                        color: roleColor(user.role),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800
                      }}>
                        {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: 11, background: 'var(--bg-elevated)', padding: '2px 7px', borderRadius: 5 }}>
                      {user.code || '—'}
                    </span>
                  </td>
                  <td>
                    <span style={getRoleBadgeStyle(user.role)}>
                      {roleLabel(user.role)}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</td>
                  <td>
                    <span className={`badge ${user.isActive ? 'badge-success' : 'badge-gray'}`}>
                      {user.isActive ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                  <td style={{ paddingRight: 16 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDeactivate(user.id, user.isActive)}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        {user.isActive ? <UserX size={12} color="#f87171" /> : <UserCheck size={12} color="#10b981" />}
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateEmployeeModal
          branches={branches}
          onClose={() => setShowCreate(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
