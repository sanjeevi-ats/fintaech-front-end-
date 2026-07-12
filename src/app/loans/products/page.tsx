'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Zap, Info, CheckCircle2, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { productService, LoanProduct } from '@/services/productService';

const FREQUENCY_MAP: Record<number, string> = {
  0: 'Monthly',
  1: 'Weekly',
  2: 'Daily',
  3: 'Bullet'
};

export default function LoanProductsPage() {
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingProduct, setEditingProduct] = useState<LoanProduct | null>(null);
  const [form, setForm] = useState({ 
    name: '', 
    code: '',
    repaymentFrequency: 0, 
    defaultTenureMonths: 12, 
    interestRate: 12,
    isActive: true,
    branchId: '00000000-0000-0000-0000-000000000000' // Default or fetch from context
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data);
      setError(null);
    } catch (err: any) {
      console.error('Fetch products error:', err);
      setError('Failed to load products. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCreate = async () => {
    try {
      setLoading(true);
      await productService.create(form as any);
      setShowCreate(false);
      fetchProducts();
    } catch (err: any) {
      alert('Error creating product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this product?')) return;
    try {
      setLoading(true);
      await productService.deactivate(id);
      fetchProducts();
    } catch (err: any) {
      alert('Error deactivating product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = (product: LoanProduct) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      code: product.code,
      repaymentFrequency: product.repaymentFrequency,
      defaultTenureMonths: product.defaultTenureMonths,
      interestRate: product.interestRate,
      isActive: product.isActive,
      branchId: '00000000-0000-0000-0000-000000000000'
    });
    setShowEdit(true);
  };

  const handleUpdate = async () => {
    if (!editingProduct) return;
    try {
      setLoading(true);
      const updated: LoanProduct = {
        ...editingProduct,
        name: form.name,
        code: form.code,
        repaymentFrequency: form.repaymentFrequency as any,
        defaultTenureMonths: form.defaultTenureMonths,
        interestRate: form.interestRate,
        isActive: form.isActive
      };
      await productService.update(editingProduct.id, updated);
      setShowEdit(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err: any) {
      alert('Error updating product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Loan Masters</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Configure loan master templates with interest types, frequencies, and tenures</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchProducts}>Refresh</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={13} /> Create Master</button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20, borderRadius: 12 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Product Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16, marginBottom: 20 }}>
        {products.length > 0 ? products.map(product => (
          <div key={product.id} className="card gradient-border" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{product.name}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="badge badge-purple">{FREQUENCY_MAP[product.repaymentFrequency]}</span>
                  <span className="badge badge-success">{product.isActive ? 'Active' : 'Inactive'}</span>
                  <span className="badge badge-gray">{product.code}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#6366f1' }}>{product.interestRate}%</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>p.a.</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button 
                    className="btn btn-secondary btn-xs" 
                    style={{ padding: '2px 6px', fontSize: 11 }}
                    onClick={() => handleEditOpen(product)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-xs" 
                    style={{ color: '#f87171', background: 'transparent', padding: 2 }}
                    onClick={() => handleDeactivate(product.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Default Tenure', val: `${product.defaultTenureMonths} Months` },
                { label: 'Frequency', val: FREQUENCY_MAP[product.repaymentFrequency] },
                { label: 'Master Code', val: product.code || 'N/A' },
              ].map((f, i) => (
                <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{f.val}</div>
                </div>
              ))}
            </div>
          </div>
        )) : (
          <div className="card" style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
             No templates found. Click "Create Master" to add one.
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: 540, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Create New Loan Master</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="input-label">Master Name</div>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <div className="input-label">Master Code</div>
                <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
              </div>
              <div>
                <div className="input-label">Default Tenure (Months)</div>
                <input className="input" type="number" value={form.defaultTenureMonths} onChange={e => setForm({ ...form, defaultTenureMonths: parseInt(e.target.value) })} />
              </div>
              <div>
                <div className="input-label">Interest Rate (%)</div>
                <input className="input" type="number" value={form.interestRate} onChange={e => setForm({ ...form, interestRate: parseFloat(e.target.value) })} />
              </div>
              <div>
                <div className="input-label">Frequency</div>
                <select className="select" style={{ width: '100%' }} value={form.repaymentFrequency} onChange={e => setForm({ ...form, repaymentFrequency: parseInt(e.target.value) })}>
                  <option value={0}>Monthly</option>
                  <option value={1}>Weekly</option>
                  <option value={2}>Daily</option>
                  <option value={3}>Bullet</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
                {loading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                Create Master
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: 540, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Edit Loan Master</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="input-label">Master Name</div>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <div className="input-label">Master Code</div>
                <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
              </div>
              <div>
                <div className="input-label">Default Tenure (Months)</div>
                <input className="input" type="number" value={form.defaultTenureMonths} onChange={e => setForm({ ...form, defaultTenureMonths: parseInt(e.target.value) })} />
              </div>
              <div>
                <div className="input-label">Interest Rate (%)</div>
                <input className="input" type="number" value={form.interestRate} onChange={e => setForm({ ...form, interestRate: parseFloat(e.target.value) })} />
              </div>
              <div>
                <div className="input-label">Frequency</div>
                <select className="select" style={{ width: '100%' }} value={form.repaymentFrequency} onChange={e => setForm({ ...form, repaymentFrequency: parseInt(e.target.value) })}>
                  <option value={0}>Monthly</option>
                  <option value={1}>Weekly</option>
                  <option value={2}>Daily</option>
                  <option value={3}>Bullet</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setShowEdit(false); setEditingProduct(null); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdate} disabled={loading}>
                {loading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
