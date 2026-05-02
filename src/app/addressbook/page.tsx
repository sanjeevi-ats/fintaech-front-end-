'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Book, Phone, MapPin, Search, Users, User, Shield, Loader2, AlertCircle } from 'lucide-react';
import { customerService, Customer } from '@/services/customerService';
import { userService, User as SystemUser } from '@/services/userService';
import { loanService, LoanCase } from '@/services/loanService';

type TabType = 'customers' | 'agents' | 'guarantors';

export default function AddressBookPage() {
  const [tab, setTab] = useState<TabType>('customers');
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agents, setAgents] = useState<SystemUser[]>([]);
  const [loans, setLoans] = useState<LoanCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [cusData, userData, loanData] = await Promise.all([
        customerService.getAll(),
        userService.getAll(),
        loanService.getAll(),
      ]);
      setCustomers(cusData);
      setAgents(userData.filter(u => u.role === 'agent'));
      setLoans(loanData);
      setError(null);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError('Failed to load directory data. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.aadhaarEncrypted && c.aadhaarEncrypted.includes(search)) ||
    (c.phone && c.phone.includes(search))
  );
  
  const filteredAgents = agents.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  // For now, we don't have a guarantors API, so we'll leave it as an empty array or keep it limited
  const allGuarantors: any[] = []; 

  const openCall = (phone: string) => window.open(`tel:${phone}`);
  const openMaps = (lat?: number, lng?: number) => {
    if (lat && lng) window.open(`https://maps.google.com/?q=${lat},${lng}`);
    else alert('GPS coordinates not available for this contact.');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading directory...</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Book size={20} color="#6366f1" /> Address Book — CRM Directory
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Unified directory of Customers, Agents & Guarantors with Quick Call & GPS</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchData}>Refresh</button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20, borderRadius: 12 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Customers', val: customers.length, color: '#6366f1', icon: User },
          { label: 'Active Agents', val: agents.length, color: '#10b981', icon: Users },
          { label: 'Loans in Directory', val: loans.length, color: '#f59e0b', icon: Shield },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="card" style={{ flex: 1, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={item.color} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search + Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search name or phone..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 30, height: 36 }} />
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', padding: 4, borderRadius: 10 }}>
          {([['customers', 'Customers'], ['agents', 'Agents'], ['guarantors', 'Guarantors']] as const).map(([key, label]) => (
            <button key={key} className={`btn btn-sm ${tab === key ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: 8 }} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Customers */}
      {tab === 'customers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {filteredCustomers.length > 0 ? filteredCustomers.map(c => {
            const loanCount = loans.filter(l => l.customerId === c.id).length;
            return (
              <div key={c.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div className="avatar" style={{ width: 42, height: 42, background: 'var(--grad-primary)', color: 'white', fontSize: 14, flexShrink: 0 }}>
                    {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.id}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {c.aadhaarEncrypted ? c.aadhaarEncrypted.slice(0, 8) + '...' : 'No Aadhaar'} · 
                      {c.panEncrypted ? c.panEncrypted.slice(0, 6) + '...' : 'No PAN'}
                    </div>
                  </div>
                  {loanCount > 0 && <span className="badge badge-success">{loanCount} Loan{loanCount > 1 ? 's' : ''}</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                  <MapPin size={10} style={{ marginTop: 2, flexShrink: 0 }} />
                  Branch: {c.branchId || 'Not assigned'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openCall(c.id)}>
                    <Phone size={11} /> Contact
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="card" style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              No customers found.
            </div>
          )}
        </div>
      )}

      {/* Agents */}
      {tab === 'agents' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {filteredAgents.length > 0 ? filteredAgents.map(a => (
            <div key={a.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div className="avatar" style={{ width: 42, height: 42, background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontSize: 14, flexShrink: 0 }}>
                  {a.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.id} · {a.email}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 12 }}>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Status</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: a.isActive ? '#34d399' : '#f87171' }}>{a.isActive ? 'Active' : 'Inactive'}</div>
                </div>
              </div>
            </div>
          )) : (
            <div className="card" style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              No agents found.
            </div>
          )}
        </div>
      )}

      {/* Guarantors Placeholder */}
      {tab === 'guarantors' && (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Shield size={48} style={{ marginBottom: 16, opacity: 0.2 }} />
          <h3>Guarantor Directory</h3>
          <p>This module is currently being integrated with the backend schema.</p>
        </div>
      )}
    </div>
  );
}
