'use client';
import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, Trash2, DollarSign, Package, TrendingDown,
  Briefcase, CheckCircle2
} from 'lucide-react';

interface Asset {
  id: string;
  code: string;
  name: string;
  category: 'Electronics' | 'Furniture' | 'Real Estate' | 'Vehicles' | 'Machinery' | 'Other';
  purchaseDate: string;
  costPrice: number;
  depreciationRate: number;
  vendor: string;
  billRef?: string;
  status: 'Active' | 'Disposed' | 'Retired' | 'Sold';
  remarks?: string;
}

const DEFAULT_ASSETS: Asset[] = [
  {
    id: '1', code: 'AST-0001', name: 'Main Office Computers (5x)', category: 'Electronics',
    purchaseDate: '2025-04-10', costPrice: 250000, depreciationRate: 20,
    vendor: 'Dell Enterprise Solutions', billRef: 'INV-Dell-948', status: 'Active',
    remarks: 'Standard employee work stations'
  },
  {
    id: '2', code: 'AST-0002', name: 'Executive Boardroom Table & Chairs', category: 'Furniture',
    purchaseDate: '2025-05-15', costPrice: 120000, depreciationRate: 10,
    vendor: 'Royaloak Furniture Ltd', billRef: 'INV-RO-8472', status: 'Active',
    remarks: 'Premium teak furniture'
  }
];

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [showCreate, setShowCreate] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', category: 'Electronics' as Asset['category'],
    purchaseDate: new Date().toISOString().split('T')[0], costPrice: '',
    depreciationRate: '15', vendor: '', billRef: '', remarks: ''
  });

  useEffect(() => {
    const stored = localStorage.getItem('company_assets');
    if (stored) {
      try { setAssets(JSON.parse(stored)); } catch { setAssets(DEFAULT_ASSETS); }
    } else {
      setAssets(DEFAULT_ASSETS);
      localStorage.setItem('company_assets', JSON.stringify(DEFAULT_ASSETS));
    }
  }, []);

  const saveAssets = (newAssets: Asset[]) => {
    setAssets(newAssets);
    localStorage.setItem('company_assets', JSON.stringify(newAssets));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.costPrice || !form.vendor.trim()) return;
    const price = parseFloat(form.costPrice);
    const rate = parseFloat(form.depreciationRate);

    if (editingAsset) {
      const updated = assets.map(a => a.id === editingAsset.id ? {
        ...a, name: form.name, category: form.category, purchaseDate: form.purchaseDate,
        costPrice: price, depreciationRate: rate, vendor: form.vendor, billRef: form.billRef, remarks: form.remarks
      } as Asset : a);
      saveAssets(updated);
      setSuccessMsg('Asset details updated!');
    } else {
      const codeNum = assets.length + 1;
      const newAsset: Asset = {
        id: Date.now().toString(), code: `AST-${codeNum.toString().padStart(4, '0')}`,
        name: form.name, category: form.category, purchaseDate: form.purchaseDate,
        costPrice: price, depreciationRate: rate, vendor: form.vendor, billRef: form.billRef,
        status: 'Active', remarks: form.remarks
      };
      saveAssets([newAsset, ...assets]);
      setSuccessMsg('New asset purchase registered!');
    }
    setShowCreate(false); setEditingAsset(null); resetForm();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setForm({
      name: asset.name, category: asset.category, purchaseDate: asset.purchaseDate,
      costPrice: asset.costPrice.toString(), depreciationRate: asset.depreciationRate.toString(),
      vendor: asset.vendor, billRef: asset.billRef || '', remarks: asset.remarks || ''
    });
    setShowCreate(true);
  };

  const handleRetire = (id: string) => {
    if (!confirm('Are you sure you want to retire this asset?')) return;
    const updated = assets.map(a => a.id === id ? { ...a, status: 'Retired' as const } : a);
    saveAssets(updated);
    setSuccessMsg('Asset retired successfully.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const resetForm = () => {
    setForm({
      name: '', category: 'Electronics', purchaseDate: new Date().toISOString().split('T')[0],
      costPrice: '', depreciationRate: '15', vendor: '', billRef: '', remarks: ''
    });
  };

  const calculateCurrentValue = (asset: Asset) => {
    if (asset.depreciationRate === 0) return asset.costPrice;
    const years = (Math.abs(new Date().getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 3600 * 24)) / 365;
    return Math.max(0, Math.round(asset.costPrice - (asset.costPrice * (asset.depreciationRate / 100) * years)));
  };

  const totalCost = assets.reduce((sum, a) => sum + (a.status === 'Active' ? a.costPrice : 0), 0);
  const totalCurrentValue = assets.reduce((sum, a) => sum + (a.status === 'Active' ? calculateCurrentValue(a) : 0), 0);
  const activeCount = assets.filter(a => a.status === 'Active').length;

  const filtered = assets.filter(a => {
    const match = a.name.toLowerCase().includes(search.toLowerCase()) || a.code.toLowerCase().includes(search.toLowerCase());
    return match && (categoryFilter === 'All' || a.category === categoryFilter);
  });

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>Company Asset Register</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Track company asset purchases and depreciation details</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setEditingAsset(null); setShowCreate(true); }}>
          <Plus size={14} /> Add Purchase
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <CheckCircle2 size={14} /> <span>{successMsg}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>TOTAL ASSET COST</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#6366f1' }}>Rs.{totalCost.toLocaleString('en-IN')}</div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>CURRENT NET VALUE</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>Rs.{totalCurrentValue.toLocaleString('en-IN')}</div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ACTIVE ASSETS</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#06b6d4' }}>{activeCount} Units</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <input className="input" style={{ flex: 1 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets..." />
        <select className="select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="All">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Furniture">Furniture</option>
          <option value="Real Estate">Real Estate</option>
          <option value="Vehicles">Vehicles</option>
          <option value="Machinery">Machinery</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 12 }}>Code</th>
              <th>Asset Name</th>
              <th>Category</th>
              <th>Purchase Date</th>
              <th>Cost Price</th>
              <th>Current Value</th>
              <th>Status</th>
              <th style={{ paddingRight: 12 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(a => (
              <tr key={a.id}>
                <td style={{ paddingLeft: 12 }} className="mono">{a.code}</td>
                <td>
                  <div>
                    <div style={{ fontWeight: 700 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.vendor}</div>
                  </div>
                </td>
                <td><span className="badge badge-gray">{a.category}</span></td>
                <td>{a.purchaseDate}</td>
                <td style={{ fontWeight: 600 }}>Rs.{a.costPrice.toLocaleString('en-IN')}</td>
                <td style={{ fontWeight: 600, color: '#10b981' }}>Rs.{calculateCurrentValue(a).toLocaleString('en-IN')}</td>
                <td><span className={`badge ${a.status === 'Active' ? 'badge-success' : 'badge-gray'}`}>{a.status}</span></td>
                <td style={{ paddingRight: 12 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(a)}><Edit2 size={11} /></button>
                    {a.status === 'Active' && <button className="btn btn-secondary btn-sm" onClick={() => handleRetire(a.id)}><Trash2 size={11} color="#f87171" /></button>}
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No assets registered.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: 480, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700 }}>{editingAsset ? 'Edit Asset Details' : 'Register Asset Purchase'}</h3>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <div>
                  <label className="input-label">Asset Name *</label>
                  <input className="input" style={{ width: '100%' }} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="input-label">Category</label>
                    <select className="select" style={{ width: '100%' }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value as any })}>
                      <option value="Electronics">Electronics</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Vehicles">Vehicles</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Purchase Date *</label>
                    <input className="input" style={{ width: '100%' }} type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="input-label">Cost Price (Rs.) *</label>
                    <input className="input" style={{ width: '100%' }} type="number" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} required />
                  </div>
                  <div>
                    <label className="input-label">Depreciation Rate (% p.a.)</label>
                    <input className="input" style={{ width: '100%' }} type="number" value={form.depreciationRate} onChange={e => setForm({ ...form, depreciationRate: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="input-label">Vendor Name *</label>
                  <input className="input" style={{ width: '100%' }} value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
