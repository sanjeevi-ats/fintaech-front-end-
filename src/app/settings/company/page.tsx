'use client';
import React, { useState, useEffect } from 'react';
import { Save, Upload, Building2, Settings, Mail, Phone, Globe, FileText, Image } from 'lucide-react';
import { companySettingsService, CompanySettings } from '@/services/companySettingsService';

export default function CompanySettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await companySettingsService.getCompanySettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load company settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      // Upload logo first if selected
      if (logoFile) {
        const logoResponse = await companySettingsService.uploadLogo(logoFile);
        settings.logo = logoResponse.logoUrl;
      }

      // Save settings
      await companySettingsService.updateCompanySettings(settings);
      setMessage('Company settings saved successfully!');
      setLogoFile(null);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
    }
  };

  if (loading) {
    return (
      <div className="fade-in-up">
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="spinner" />
          <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Loading company settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="fade-in-up">
        <div style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Failed to load company settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Building2 size={20} color="#6366f1" /> Company Settings
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Configure company details for receipts and documents
        </p>
      </div>

      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: 20 }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Settings Form */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Company Information</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="input-label">Company Name</label>
                <input
                  className="input"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label">Full Legal Name</label>
                <input
                  className="input"
                  value={settings.fullName}
                  onChange={(e) => setSettings({ ...settings, fullName: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="input-label">Address</label>
              <input
                className="input"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="input-label">City</label>
                <input
                  className="input"
                  value={settings.city}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label">State</label>
                <input
                  className="input"
                  value={settings.state}
                  onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label">PIN Code</label>
                <input
                  className="input"
                  value={settings.pinCode}
                  onChange={(e) => setSettings({ ...settings, pinCode: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Contact Information</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="input-label">
                  <Phone size={14} style={{ marginRight: 6 }} />
                  Phone Number
                </label>
                <input
                  className="input"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label">
                  <Mail size={14} style={{ marginRight: 6 }} />
                  Email Address
                </label>
                <input
                  className="input"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="input-label">
                <Globe size={14} style={{ marginRight: 6 }} />
                Website
              </label>
              <input
                className="input"
                value={settings.website}
                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Legal & Compliance</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="input-label">GST Number</label>
                <input
                  className="input"
                  value={settings.gstNumber}
                  onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label">License Number</label>
                <input
                  className="input"
                  value={settings.licenseNumber}
                  onChange={(e) => setSettings({ ...settings, licenseNumber: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="input-label">Registration Number</label>
              <input
                className="input"
                value={settings.registrationNumber}
                onChange={(e) => setSettings({ ...settings, registrationNumber: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Receipt Settings</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="input-label">Receipt Prefix</label>
                <input
                  className="input"
                  value={settings.receiptPrefix}
                  onChange={(e) => setSettings({ ...settings, receiptPrefix: e.target.value })}
                  placeholder="RCP"
                />
              </div>
              <div>
                <label className="input-label">Receipt Language</label>
                <select
                  className="input"
                  value={settings.receiptLanguage}
                  onChange={(e) => setSettings({ ...settings, receiptLanguage: e.target.value as any })}
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="input-label">Receipt Footer Text</label>
              <textarea
                className="input"
                rows={3}
                value={settings.receiptFooterText}
                onChange={(e) => setSettings({ ...settings, receiptFooterText: e.target.value })}
                placeholder="Thank you message for receipts"
              />
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={settings.showBranchDetails}
                  onChange={(e) => setSettings({ ...settings, showBranchDetails: e.target.checked })}
                  style={{ marginRight: 8 }}
                />
                Show branch details in receipts
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={settings.showTerminalDetails}
                  onChange={(e) => setSettings({ ...settings, showTerminalDetails: e.target.checked })}
                  style={{ marginRight: 8 }}
                />
                Show terminal info in receipts
              </label>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--bg-border)', paddingTop: 20 }}>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Logo & Preview */}
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Company Logo</h3>
            
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              {settings.logo ? (
                <img 
                  src={settings.logo} 
                  alt="Company Logo"
                  style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8 }}
                />
              ) : (
                <div style={{
                  width: 120,
                  height: 120,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  fontSize: 36,
                  fontWeight: 800,
                  color: '#ffffff'
                }}>
                  {settings.name.charAt(0)}
                </div>
              )}
            </div>

            <div>
              <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Upload size={16} />
                Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  style={{ display: 'none' }}
                />
              </label>
              {logoFile && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  Selected: {logoFile.name}
                </p>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Info</h3>
            
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <p><strong>Business Type:</strong> {settings.businessType}</p>
              <p><strong>Tagline:</strong> {settings.tagline}</p>
              <p><strong>Country:</strong> {settings.country}</p>
              
              <div style={{ marginTop: 16, padding: 12, backgroundColor: 'var(--bg-elevated)', borderRadius: 8 }}>
                <p style={{ fontSize: 11, margin: 0 }}>
                  <FileText size={12} style={{ marginRight: 4 }} />
                  Settings will be applied to all new receipts and documents generated by the system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}