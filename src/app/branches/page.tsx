'use client';
import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Users, TrendingUp, Loader2, AlertTriangle, Plus } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { branchService, Branch } from '@/services/branchService';

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await branchService.getAll();
      setBranches(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.address) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await branchService.create({
        ...formData,
        isActive: true,
      });
      setShowCreateModal(false);
      setFormData({ name: '', code: '', address: '', phone: '', email: '' });
      await loadBranches();
      alert('Branch created successfully!');
    } catch (err: any) {
      alert(`Failed to create branch: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="fade-in-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <Loader2 className="animate-spin" size={32} />
        <span style={{ marginLeft: 12 }}>Loading branches...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in-up">
        <div className="alert alert-danger">
          <AlertTriangle size={16} />
          Error loading branches: {error}
          <button className="btn btn-secondary btn-sm" onClick={loadBranches} style={{ marginLeft: 12 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Branch Network Management</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Multi-tenant branch directory · {branches.length} active branches
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={13} /> New Branch
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Branches', val: branches.length.toString(), color: '#6366f1' },
          { label: 'Active Branches', val: branches.filter(b => b.isActive).length.toString(), color: '#10b981' },
          { label: 'Inactive Branches', val: branches.filter(b => !b.isActive).length.toString(), color: '#6b7280' },
          { label: 'Total Coverage', val: `${branches.length} Cities`, color: '#06b6d4' },
        ].map((item, i) => (
          <div key={i} className="card" style={{ flex: 1, padding: 16 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Branch Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
        {branches.map((branch) => {
          const isActive = branch.isActive;
          return (
            <div key={branch.id} className="card" style={{ 
              borderLeft: `3px solid ${isActive ? '#10b981' : '#6b7280'}`,
              opacity: isActive ? 1 : 0.7
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Building2 size={15} color="#6366f1" />
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{branch.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className="badge badge-gray">{branch.code}</span>
                    <span className={`badge ${isActive ? 'badge-success' : 'badge-gray'}`}>
                      {isActive ? '✓ Active' : '○ Inactive'}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {branch.createdAt ? new Date(branch.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              {/* Branch Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <MapPin size={12} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {branch.address}
                  </span>
                </div>
                
                {branch.phone && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    📞 {branch.phone}
                  </div>
                )}
                
                {branch.email && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    ✉️ {branch.email}
                  </div>
                )}
              </div>

              {/* Metrics Placeholder */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[
                  { label: 'Loans', val: 'N/A', color: '#34d399' },
                  { label: 'AUM', val: 'N/A', color: '#a5b4fc' },
                  { label: 'PAR', val: 'N/A', color: '#fbbf24' },
                  { label: 'Staff', val: 'N/A', color: '#06b6d4' },
                ].map((m, j) => (
                  <div key={j} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{m.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{m.val}</div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--bg-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Users size={11} color="var(--text-muted)" />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Manager: {branch.managerId ? 'Assigned' : 'Not Assigned'}
                  </span>
                </div>
                <button className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}>View Details</button>
              </div>
            </div>
          );
        })}
        
        {branches.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40 }}>
            <Building2 size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>No Branches Found</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Create your first branch to get started
            </div>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={13} /> Create First Branch
            </button>
          </div>
        )}
      </div>

      {/* Create Branch Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Create New Branch</div>
            <form onSubmit={handleCreateBranch}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div className="input-label">Branch Name *</div>
                  <input 
                    className="input" 
                    type="text" 
                    placeholder="e.g. Mumbai - Andheri"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <div className="input-label">Branch Code *</div>
                  <input 
                    className="input" 
                    type="text" 
                    placeholder="e.g. MUM-AND-001"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <div className="input-label">Address *</div>
                  <textarea 
                    className="input" 
                    placeholder="Complete branch address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <div className="input-label">Phone Number</div>
                  <input 
                    className="input" 
                    type="tel" 
                    placeholder="Branch contact number"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <div className="input-label">Email</div>
                  <input 
                    className="input" 
                    type="email" 
                    placeholder="branch@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Building2 size={13} /> Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
