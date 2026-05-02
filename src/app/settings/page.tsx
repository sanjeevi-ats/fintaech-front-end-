'use client';
import React, { useState } from 'react';
import {
  Settings, Building2, Shield, Bell, Palette, Database,
  Users, Key, Save, RefreshCw, Globe, Smartphone, Mail, Lock
} from 'lucide-react';
import { useAuth, ROLE_LABELS } from '@/context/AuthContext';

type Tab = 'general' | 'security' | 'notifications' | 'appearance' | 'integrations';

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('general');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'general',       label: 'General',       icon: Settings },
    { key: 'security',      label: 'Security',       icon: Shield },
    { key: 'notifications', label: 'Notifications',  icon: Bell },
    { key: 'appearance',    label: 'Appearance',     icon: Palette },
    { key: 'integrations',  label: 'Integrations',   icon: Globe },
  ];

  return (
    <div className="fade-in-up" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings size={20} color="#6366f1" /> Settings
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          System configuration for {user?.branch || 'All Branches'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Sidebar tabs */}
        <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <div
                key={t.key}
                className={`nav-item ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}
                style={{ borderRadius: 10 }}
              >
                <Icon size={15} />
                <span style={{ fontSize: 13 }}>{t.label}</span>
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="card" style={{ flex: 1, padding: 28 }}>

          {/* General */}
          {tab === 'general' && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>General Settings</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <div>
                  <div className="input-label">Organisation Name</div>
                  <input className="input" defaultValue="AnnaiTech Solutions Pvt. Ltd." />
                </div>
                <div>
                  <div className="input-label">Default Currency</div>
                  <select className="select" style={{ width: '100%' }}>
                    <option>Indian Rupee (₹ INR)</option>
                    <option>US Dollar ($ USD)</option>
                  </select>
                </div>
                <div>
                  <div className="input-label">Financial Year Start</div>
                  <select className="select" style={{ width: '100%' }}>
                    <option>April (India standard)</option>
                    <option>January</option>
                  </select>
                </div>
                <div>
                  <div className="input-label">Timezone</div>
                  <select className="select" style={{ width: '100%' }}>
                    <option>Asia/Kolkata (IST +05:30)</option>
                    <option>UTC</option>
                  </select>
                </div>
                <div>
                  <div className="input-label">Date Format</div>
                  <select className="select" style={{ width: '100%' }}>
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <div className="input-label">Default Branch</div>
                  <select className="select" style={{ width: '100%' }}>
                    <option>Mumbai – Andheri (BRN-001)</option>
                    <option>Delhi – Rohini (BRN-002)</option>
                    <option>Pune – Kothrud (BRN-003)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--bg-border)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={15} color="#6366f1" /> Loan Defaults
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  {[
                    { label: 'Default Grace Period (days)', val: '2' },
                    { label: 'Max Loan Tenure (months)', val: '60' },
                    { label: 'Min Loan Amount (₹)', val: '5000' },
                  ].map(f => (
                    <div key={f.label}>
                      <div className="input-label">{f.label}</div>
                      <input className="input" type="number" defaultValue={f.val} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {tab === 'security' && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Security Settings</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Session Timeout (minutes)', desc: 'Auto-logout after inactivity', val: '30', icon: Lock },
                  { label: 'Max Failed Login Attempts', desc: 'Account locks after this many failures', val: '5', icon: Shield },
                  { label: 'Lockout Duration (minutes)', desc: 'How long the account stays locked', val: '15', icon: Shield },
                  { label: 'Password Expiry (days)', desc: 'Force password reset after this period', val: '90', icon: Key },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={16} color="#6366f1" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</div>
                      </div>
                      <input className="input" type="number" defaultValue={item.val} style={{ width: 80, textAlign: 'right' }} />
                    </div>
                  );
                })}

                <div style={{ padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>MFA Requirements</div>
                  {['Super Admin', 'Partner / Investor'].map(role => (
                    <div key={role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{role}</span>
                      <span className="badge badge-success" style={{ fontSize: 10 }}>MFA Required</span>
                    </div>
                  ))}
                  {['Branch Manager', 'Accountant', 'Collection Officer', 'Loan Officer'].map(role => (
                    <div key={role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{role}</span>
                      <span className="badge badge-gray" style={{ fontSize: 10 }}>Optional</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {tab === 'notifications' && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Notification Preferences</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Overdue loan alerts', desc: 'Notify when EMI is past due date', on: true },
                  { label: 'Disbursement confirmation', desc: 'Email/SMS on successful disbursal', on: true },
                  { label: 'Day-end reconciliation reminder', desc: 'Daily at 6 PM if not completed', on: true },
                  { label: 'New case assigned', desc: 'When a case is assigned to you', on: false },
                  { label: 'Partner profit distribution', desc: 'When monthly profit is distributed', on: true },
                  { label: 'Audit log activity', desc: 'Notify on sensitive field changes', on: false },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</div>
                    </div>
                    <ToggleSwitch defaultOn={item.on} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appearance */}
          {tab === 'appearance' && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Appearance</div>
              <div>
                <div className="input-label" style={{ marginBottom: 10 }}>Theme</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['Dark (Default)', 'Light', 'System'].map((t, i) => (
                    <div key={t} style={{ flex: 1, padding: '16px', background: i === 0 ? 'rgba(99,102,241,0.15)' : 'var(--bg-elevated)', border: `1px solid ${i === 0 ? '#6366f1' : 'var(--bg-border)'}`, borderRadius: 10, textAlign: 'center', cursor: 'pointer' }}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{['🌑', '☀️', '💻'][i]}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: i === 0 ? '#a5b4fc' : 'var(--text-secondary)' }}>{t}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 20 }}>
                <div className="input-label" style={{ marginBottom: 10 }}>Accent Color</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'].map(color => (
                    <div key={color} style={{ width: 32, height: 32, borderRadius: '50%', background: color, cursor: 'pointer', border: color === '#6366f1' ? '3px solid white' : '3px solid transparent' }} />
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 20 }}>
                <div className="input-label" style={{ marginBottom: 8 }}>Sidebar Density</div>
                <select className="select" style={{ width: '50%' }}>
                  <option>Compact</option>
                  <option>Default</option>
                  <option>Comfortable</option>
                </select>
              </div>
            </div>
          )}

          {/* Integrations */}
          {tab === 'integrations' && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Integrations & APIs</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { name: 'SMS Gateway (MSG91)', status: 'connected', color: '#10b981', icon: Smartphone },
                  { name: 'Email (SendGrid)', status: 'connected', color: '#10b981', icon: Mail },
                  { name: 'WhatsApp Business API', status: 'not configured', color: '#f59e0b', icon: Smartphone },
                  { name: 'PostgreSQL Database', status: 'connected', color: '#10b981', icon: Database },
                  { name: 'RazorPay Payment Gateway', status: 'not configured', color: '#f59e0b', icon: Globe },
                  { name: 'Aadhaar eKYC (UIDAI)', status: 'pending approval', color: '#6366f1', icon: Users },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={16} color={item.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                      </div>
                      <span className={`badge ${item.status === 'connected' ? 'badge-success' : item.status === 'pending approval' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                        {item.status}
                      </span>
                      <button className="btn btn-secondary btn-sm">Configure</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Save button */}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--bg-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-primary" onClick={handleSave}>
              {saved ? <><RefreshCw size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
            </button>
            {saved && <span style={{ fontSize: 12, color: '#34d399' }}>✓ Settings saved successfully</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ defaultOn }: { defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div onClick={() => setOn(!on)} style={{ width: 42, height: 22, borderRadius: 11, background: on ? '#6366f1' : 'var(--bg-border)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 22 : 3, width: 16, height: 16, borderRadius: 8, background: 'white', transition: 'left 0.2s' }} />
    </div>
  );
}
