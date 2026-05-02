'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, ChevronDown, Building2, LogOut, User, Settings } from 'lucide-react';
import { useAuth, ROLE_HOME, ROLE_LABELS, demoUsers } from '@/context/AuthContext';
import { BRANCHES } from '@/lib/utils';

export default function TopBar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [search, setSearch] = useState('');

  if (!user) return null;

  const notifications = [
    { id: 1, type: 'danger', msg: 'LN-2024-007 is 62 days overdue — Legal Flag triggered', time: '5m ago' },
    { id: 2, type: 'warning', msg: 'Day-End reconciliation pending for Branch: Mumbai', time: '12m ago' },
    { id: 3, type: 'success', msg: '₹5.6L disbursed successfully today', time: '1h ago' },
    { id: 4, type: 'info', msg: 'Partner Sunita Rao has initiated a drawdown of ₹50,000', time: '2h ago' },
  ];

  const dotColor: Record<string, string> = {
    danger: '#ef4444', warning: '#f59e0b', success: '#10b981', info: '#6366f1'
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <header style={{
      height: 60, background: 'var(--bg-surface)', borderBottom: '1px solid var(--bg-border)',
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
      position: 'sticky', top: 0, zIndex: 99,
    }}>
      {/* Search */}
      <div style={{ flex: 1, position: 'relative', maxWidth: 420 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="input" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search customers, loans, transactions..."
          style={{ paddingLeft: 34, height: 36, borderRadius: 8 }} />
      </div>

      {/* Branch Selector */}
      {(user.role === 'super_admin' || user.role === 'branch_manager') && (
        <div style={{ position: 'relative' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowBranchMenu(!showBranchMenu)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 size={13} />
            {user.role === 'super_admin' ? 'All Branches' : user.branch}
            <ChevronDown size={11} />
          </button>
          {showBranchMenu && (
            <div style={{ position: 'absolute', top: '110%', right: 0, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 10, padding: 6, minWidth: 220, zIndex: 999, boxShadow: 'var(--shadow-lg)' }}>
              {BRANCHES.map(b => (
                <div key={b.id} className="nav-item" onClick={() => setShowBranchMenu(false)} style={{ fontSize: 12 }}>
                  {b.name} <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{b.code}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Role pill (replaces old Demo Role switcher) */}
      <div style={{ padding: '4px 10px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, fontSize: 11, color: '#a5b4fc', fontWeight: 600 }}>
        {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
      </div>

      {/* Notifications */}
      <div style={{ position: 'relative' }}>
        <button className="btn btn-secondary btn-icon" onClick={() => setShowNotifications(!showNotifications)} style={{ position: 'relative' }}>
          <Bell size={15} />
          <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} className="pulse-dot" />
        </button>
        {showNotifications && (
          <div style={{ position: 'absolute', top: '110%', right: 0, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 12, padding: 12, width: 340, zIndex: 999, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Notifications</div>
            {notifications.map(n => (
              <div key={n.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--bg-border)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', marginTop: 6, flexShrink: 0, background: dotColor[n.type] }} />
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>{n.msg}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Avatar + Menu */}
      <div style={{ position: 'relative' }}>
        <div className="avatar" onClick={() => setShowUserMenu(!showUserMenu)}
          style={{ background: 'var(--grad-primary)', color: 'white', cursor: 'pointer' }}>
          {user.avatar}
        </div>
        {showUserMenu && (
          <div style={{ position: 'absolute', top: '110%', right: 0, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 12, padding: 8, minWidth: 200, zIndex: 999, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--bg-border)', marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</div>
              <div style={{ fontSize: 10, color: '#a5b4fc', marginTop: 2 }}>{user.branch}</div>
            </div>
            <div className="nav-item" style={{ fontSize: 12 }}>
              <User size={13} /> Profile
            </div>
            <div className="nav-item" style={{ fontSize: 12 }}>
              <Settings size={13} /> Settings
            </div>
            <div className="nav-item" style={{ fontSize: 12, color: '#f87171', marginTop: 4, borderTop: '1px solid var(--bg-border)', paddingTop: 8 }}
              onClick={handleLogout}>
              <LogOut size={13} /> Sign Out
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
