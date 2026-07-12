'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import capitalAccountService from '@/services/capitalAccountService';
import { partnerService, Partner as PartnerType } from '@/services/partnerService';

export default function NewCapitalAccountPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [partners, setPartners] = useState<PartnerType[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Check access control
  useEffect(() => {
    if (user && user.role !== 'super_admin' && user.role !== 'branch_manager') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Fetch partners
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        const allPartners = await partnerService.getAll();
        setPartners(allPartners);
      } catch (err: any) {
        console.error('Fetch partners error:', err);
        setError('Failed to load partners. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  // Filter partners based on search
  const filteredPartners = partners.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      (p.name?.toLowerCase().includes(query)) || (p.code?.toLowerCase().includes(query)) || (p.email?.toLowerCase().includes(query))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');

    // Validation
    if (!selectedPartnerId) {
      setError('Please select a partner');
      return;
    }

    if (!openingBalance || isNaN(Number(openingBalance)) || Number(openingBalance) <= 0) {
      setError('Please enter a valid opening balance (in rupees)');
      return;
    }

    try {
      setSubmitting(true);

      // Convert rupees to paise (multiply by 100)
      const balanceInPaise = Math.round(Number(openingBalance) * 100);

      // Create the account
      const response = await capitalAccountService.create({
        partnerId: selectedPartnerId,
        openingBalance: balanceInPaise,
      });

      setSuccessMessage('Capital account created successfully! Redirecting...');
      setTimeout(() => {
        router.push(`/capital-accounts/${response.id}/transactions`);
      }, 1500);
    } catch (err: any) {
      console.error('Create account error:', err);
      setError(err.message || 'Failed to create capital account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedPartnerId('');
    setOpeningBalance('');
    setError(null);
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          gap: 12,
        }}
      >
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading partners...</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => router.back()}
          className="btn btn-secondary"
          title="Go back"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Create Capital Account</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Register a new investor capital account</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20, borderRadius: 12 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: 20, borderRadius: 12 }}>
          <CheckCircle size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="card" style={{ maxWidth: 600, padding: 24 }}>
        <form onSubmit={handleSubmit}>
          {/* Partner Selection */}
          <div style={{ marginBottom: 20 }}>
            <label className="input-label">
              Partner
              <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Search partner by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                fontSize: 13,
                marginBottom: 10,
                boxSizing: 'border-box',
                backgroundColor: 'var(--bg-base)',
              }}
            />

            <select
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                fontSize: 13,
                boxSizing: 'border-box',
                backgroundColor: 'var(--bg-base)',
              }}
            >
              <option value="">-- Select a Partner --</option>
              {filteredPartners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.code ? `${partner.code} - ${partner.name}` : partner.name} ({partner.email})
                </option>
              ))}
            </select>

            {selectedPartnerId && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, fontSize: 12 }}>
                <strong>Selected:</strong>{' '}
                {partners.find((p) => p.id === selectedPartnerId)?.name}
              </div>
            )}
          </div>

          {/* Opening Balance */}
          <div style={{ marginBottom: 20 }}>
            <label className="input-label">
              Opening Balance (in Rupees)
              <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#6366f1' }}>₹</span>
              <input
                type="number"
                placeholder="Enter opening balance"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                step="0.01"
                min="0"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  fontSize: 13,
                  boxSizing: 'border-box',
                  backgroundColor: 'var(--bg-base)',
                }}
              />
            </div>
            {openingBalance && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                = ₹{(Number(openingBalance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in paise
              </p>
            )}
          </div>

          {/* Info Section */}
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 8,
              padding: 12,
              marginBottom: 20,
              fontSize: 12,
            }}
          >
            <div style={{ fontWeight: 600, color: '#6366f1', marginBottom: 6 }}>Account Details</div>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, paddingLeft: 16 }}>
              <li>An account code will be auto-generated (CAP0001, CAP0002, etc.)</li>
              <li>Opening balance will be set as current balance initially</li>
              <li>Ownership percentage will be calculated automatically</li>
              <li>Account status will be set to "active"</li>
              <li>You can record transactions after account creation</li>
            </ul>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={submitting}
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !selectedPartnerId || !openingBalance}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
