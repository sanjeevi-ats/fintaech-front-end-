'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, DollarSign, FileText, CreditCard,
  TrendingUp, BookOpen, Shield, Settings, ChevronDown,
  Building2, Bell, Search, LogOut, ChevronRight, Menu, X,
  Landmark, Scale, UserCheck, Map, PieChart, AlertTriangle,
  Receipt, ClipboardList, Wallet, ArrowRightLeft, Brain, Book, Briefcase
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/lib/utils';
import { companyService } from '@/services/companyService';

const navConfig: Record<string, any[]> = {
  super_admin: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { label: '+ New Case', icon: FileText, href: '/cases/new' },
    { label: 'Branches', icon: Building2, href: '/branches' },
    { label: 'Equity Engine', icon: TrendingUp, href: '/equity', children: [
      { label: 'Partners', href: '/equity/partners' },
      { label: 'Profit Distribution', href: '/equity/profit' },
    ]},
    { label: 'Loan Portfolio', icon: CreditCard, href: '/loans', children: [
      { label: 'All Loans', href: '/loans' },
      { label: 'Applications', href: '/loans/applications' },
      { label: 'Loan Approvals', href: '/loan-approvals' },
      { label: 'Loan Masters', href: '/loans/products' },
      { label: 'Asset Details', href: '/assets' },
    ]},
    { label: 'Collections', icon: ClipboardList, href: '/collections', children: [
      { label: 'Overview', href: '/collections' },
      { label: 'Approvals', href: '/collection-approvals' },
    ]},
    { label: 'Collection Entry Sheet', icon: FileText, href: '/collection-entry' },
    { label: 'Quick Pay & Receipts', icon: Receipt, href: '/quick-pay' },
    { label: 'Capital Accounts', icon: Wallet, href: '/capital-accounts' },
    { label: 'General Ledger', icon: Scale, href: '/ledger' },
    { label: 'Accounting', icon: BookOpen, href: '/accounting', children: [
      { label: 'Journal Entries', href: '/accounting/journal' },
      { label: 'Day-End Close', href: '/accounting/dayend' },
    ]},
    { label: 'Address Book', icon: Book, href: '/addressbook' },
    { label: 'Reports', icon: PieChart, href: '/reports' },
    { label: 'Audit Logs', icon: Shield, href: '/audit' },
    { label: 'Employees', icon: UserCheck, href: '/rbac' },
    { label: 'Settings', icon: Settings, href: '/settings', children: [
      { label: 'General', href: '/settings' },
      { label: 'Company', href: '/settings/company' },
    ]},
  ],
  partner: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { label: 'Profit History', icon: TrendingUp, href: '/equity/profit' },
    { label: 'Loan Portfolio', icon: CreditCard, href: '/loans' },
    { label: 'Reports', icon: PieChart, href: '/reports' },
  ],
  branch_manager: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { label: '+ New Case', icon: FileText, href: '/cases/new' },
    { label: 'Loan Portfolio', icon: CreditCard, href: '/loans', children: [
      { label: 'All Loans', href: '/loans' },
      { label: 'Applications', href: '/loans/applications' },
      { label: 'Loan Approvals', href: '/loan-approvals' },
      { label: 'Asset Details', href: '/assets' },
    ]},
    { label: 'Quick Pay & Receipts', icon: Receipt, href: '/quick-pay' },
    { label: 'Collection Entry Sheet', icon: FileText, href: '/collection-entry' },
    { label: 'Collections', icon: ClipboardList, href: '/collections', children: [
      { label: 'Overview', href: '/collections' },
      { label: 'Approvals', href: '/collection-approvals' },
    ]},
    { label: 'General Ledger', icon: Scale, href: '/ledger' },
    { label: 'Capital Accounts', icon: Wallet, href: '/capital-accounts' },
    { label: 'Accounting', icon: BookOpen, href: '/accounting', children: [
      { label: 'Journal Entries', href: '/accounting/journal' },
      { label: 'Day-End Close', href: '/accounting/dayend' },
    ]},
    { label: 'Address Book', icon: Book, href: '/addressbook' },
    { label: 'Audit Logs', icon: Shield, href: '/audit' },
    { label: 'Employees', icon: UserCheck, href: '/rbac' },
    { label: 'Company Settings', icon: Settings, href: '/settings/company' },
  ],
  accountant: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { label: 'General Ledger', icon: Scale, href: '/ledger' },
    { label: 'Journal Entries', icon: ArrowRightLeft, href: '/accounting/journal' },
    { label: 'Day-End Close', icon: Scale, href: '/accounting/dayend' },
    { label: 'Reports', icon: PieChart, href: '/reports' },
  ],
  collection_officer: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { label: 'Quick Pay & Receipts', icon: Receipt, href: '/quick-pay' },
    { label: 'Collection Entry Sheet', icon: FileText, href: '/collection-entry' },
    { label: 'Collections', icon: ClipboardList, href: '/collections', children: [
      { label: 'Overview', href: '/collections' },
      { label: 'Approvals', href: '/collection-approvals' },
    ]},
    { label: 'My Loans', icon: CreditCard, href: '/loans' },
  ],
  recovery_specialist: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { label: 'Recovery Cases', icon: AlertTriangle, href: '/collections' },
  ],
  loan_officer: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { label: '+ New Case', icon: FileText, href: '/cases/new' },
    { label: 'Applications', icon: FileText, href: '/loans/applications' },
    { label: 'Loan Portfolio', icon: CreditCard, href: '/loans' },
    { label: 'Loan Masters', icon: Brain, href: '/loans/products' },
    { label: 'Asset Details', icon: Briefcase, href: '/assets' },
    { label: 'Address Book', icon: Book, href: '/addressbook' },
  ],
};

interface NavItemType { label: string; icon?: React.ElementType; href: string; children?: { label: string; href: string }[] }

function NavItem({ item, collapsed }: { item: NavItemType; collapsed: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => pathname.startsWith(item.href + '/') || pathname === item.href);
  const Icon = item.icon;
  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));

  if (item.children) {
    return (
      <div>
        <div className={`nav-item ${isActive ? 'active' : ''}`} onClick={() => setOpen(!open)}>
          {Icon && <Icon size={16} />}
          {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
          {!collapsed && <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />}
        </div>
        {open && !collapsed && (
          <div style={{ paddingLeft: 28, marginTop: 2 }}>
            {item.children.map(child => (
              <Link key={child.href} href={child.href} style={{ textDecoration: 'none' }}>
                <div className={`nav-item ${pathname === child.href ? 'active' : ''}`} style={{ fontSize: 12, padding: '7px 10px' }}>
                  <ChevronRight size={11} />{child.label}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link href={item.href} style={{ textDecoration: 'none' }}>
      <div className={`nav-item ${isActive ? 'active' : ''}`}>
        {Icon && <Icon size={16} />}
        {!collapsed && <span>{item.label}</span>}
      </div>
    </Link>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [companySettings, setCompanySettings] = useState<any>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await companyService.get();
        if (res && res.companyName) {
          setCompanySettings(res);
        }
      } catch (err) {
        console.error('Failed to load company settings in Sidebar', err);
      }
    };
    fetchCompany();
  }, []);

  if (!user) return null;
  const items = navConfig[user.role] || navConfig.super_admin;

  return (
    <aside style={{
      width: collapsed ? 60 : 240,
      minHeight: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--bg-border)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s ease',
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
      overflowY: 'auto', overflowX: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 14px', borderBottom: '1px solid var(--bg-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
          {companySettings?.logoBase64 ? (
            <img 
              src={`data:${companySettings.logoMimeType || 'image/png'};base64,${companySettings.logoBase64}`} 
              alt="Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <Landmark size={16} color="white" />
          )}
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              {companySettings?.companyName || 'MicroFin'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
              {companySettings?.tagline || 'SaaS Platform'}
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="btn btn-secondary btn-icon" style={{ marginLeft: 'auto', padding: 5 }}>
          {collapsed ? <ChevronRight size={13} /> : <Menu size={13} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {items.map((item: NavItemType) => (
          <NavItem key={item.href} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* User */}
      {!collapsed && (
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--bg-border)' }}>
          <div style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="avatar" style={{ background: 'var(--grad-primary)', color: 'white', fontSize: 11, width: 30, height: 30, flexShrink: 0 }}>
              {user.avatar}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
