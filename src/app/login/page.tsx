'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, Shield, AlertTriangle, CheckCircle2, Loader2, ArrowRight, Smartphone } from 'lucide-react';
import { useAuth, ROLE_HOME, ROLE_LABELS } from '@/context/AuthContext';

// Demo credential hints
const DEMO_HINTS = [
  { role: 'Super Admin', email: 'admin@annaitech.in', password: 'Admin@123', color: '#6366f1' },
  { role: 'Partner', email: 'partner@annaitech.in', password: 'Partner@123', color: '#8b5cf6' },
  { role: 'Branch Manager', email: 'manager@annaitech.in', password: 'Manager@123', color: '#10b981' },
  { role: 'Accountant', email: 'accountant@annaitech.in', password: 'Accounts@123', color: '#f59e0b' },
  { role: 'Collection Officer', email: 'collection@annaitech.in', password: 'Collect@123', color: '#06b6d4' },
];

function LoginPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, verifyMFA, isLoading, loginError, failedAttempts, isLocked, clearError, isAuthenticated, user } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [phase, setPhase] = useState<'login' | 'mfa' | 'success'>('login');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [lockCountdown, setLockCountdown] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectTo = params.get('redirect') || ROLE_HOME[user.role] || '/';
      router.replace(redirectTo);
    }
  }, [isAuthenticated, user, router, params]);

  // Loading progress bar animation
  useEffect(() => {
    if (isLoading) {
      setLoadingProgress(0);
      const interval = setInterval(() => setLoadingProgress(p => Math.min(p + 8, 90)), 80);
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
      const t = setTimeout(() => setLoadingProgress(0), 600);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  // Lock countdown
  useEffect(() => {
    if (!isLocked) return;
    const interval = setInterval(() => {
      setLockCountdown(c => Math.max(0, c - 1));
    }, 1000);
    setLockCountdown(15 * 60);
    return () => clearInterval(interval);
  }, [isLocked]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const result = await login(email, password, rememberMe);
    if (result.success && result.requiresMFA) {
      setPhase('mfa');
    } else if (result.success) {
      setPhase('success');
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) {
      const nextInput = document.getElementById(`otp-${i + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus();
    }
  };

  const handleMFA = async () => {
    clearError();
    const code = otp.join('');
    const ok = await verifyMFA(code);
    if (ok) setPhase('success');
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    await new Promise(r => setTimeout(r, 800));
    setForgotSent(true);
  };

  const fillDemo = (email: string, password: string) => {
    setEmail(email); setPassword(password); setShowHints(false);
  };

  const lockMins = Math.floor(lockCountdown / 60);
  const lockSecs = lockCountdown % 60;

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a14 0%, #0d0d1f 50%, #080812 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Ambient background orbs */}
      <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', top: -200, left: -100, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', bottom: -200, right: -100, pointerEvents: 'none' }} />

      {/* Loading progress bar */}
      {loadingProgress > 0 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 999 }}>
          <div style={{ height: '100%', width: `${loadingProgress}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', transition: 'width 0.08s linear' }} />
        </div>
      )}

      {/* Main card */}
      <div style={{
        width: '100%', maxWidth: 440, padding: '0 16px',
        animation: 'fadeInUp 0.5s ease',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
          }}>
            <Shield size={26} color="white" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>AnnaiTech Solutions</div>
          <div style={{ fontSize: 13, color: '#5a5a72', marginTop: 4 }}>Microfinance ERP — Secure Gateway</div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: 32,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}>

          {/* ─── Lock State ─── */}
          {isLocked && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#f87171', marginBottom: 8 }}>Account Temporarily Locked</div>
              <div style={{ fontSize: 13, color: '#5a5a72', marginBottom: 20 }}>5 failed attempts detected. Security lockout in effect.</div>
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 12, padding: '16px 20px',
              }}>
                <div style={{ fontSize: 11, color: '#5a5a72', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Unlocks in</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#f87171', fontVariantNumeric: 'tabular-nums' }}>
                  {String(lockMins).padStart(2, '0')}:{String(lockSecs).padStart(2, '0')}
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#5a5a72', marginTop: 16 }}>Contact your supervisor or IT Admin if this is an error.</p>
            </div>
          )}

          {/* ─── Forgot Password ─── */}
          {!isLocked && forgotMode && (
            <div>
              <button onClick={() => { setForgotMode(false); setForgotSent(false); }} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
                ← Back to login
              </button>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Reset Password</div>
              <div style={{ fontSize: 13, color: '#5a5a72', marginBottom: 20 }}>Enter your email and we'll send a reset link.</div>
              {forgotSent ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <CheckCircle2 size={36} color="#34d399" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#34d399' }}>Reset link sent!</div>
                  <div style={{ fontSize: 12, color: '#5a5a72', marginTop: 6 }}>Check your inbox at {forgotEmail}</div>
                </div>
              ) : (
                <form onSubmit={handleForgot}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: '#9494aa', marginBottom: 6 }}>Email Address</div>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5a5a72' }} />
                      <input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                        placeholder="your@email.com"
                        style={{ width: '100%', padding: '11px 12px 11px 36px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <button type="submit" style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Send Reset Link
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ─── MFA Step ─── */}
          {!isLocked && !forgotMode && phase === 'mfa' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Smartphone size={22} color="#6366f1" />
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>Two-Factor Authentication</div>
                <div style={{ fontSize: 12, color: '#5a5a72', marginTop: 6 }}>Enter the 6-digit code from your authenticator app</div>
                <div style={{ fontSize: 11, color: '#6366f1', marginTop: 4 }}>Demo: enter any 6 digits (e.g. 123456)</div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                {otp.map((d, i) => (
                  <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    style={{
                      width: 44, height: 52, textAlign: 'center', fontSize: 22, fontWeight: 700,
                      background: d ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${d ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 10, color: '#fff', outline: 'none',
                      transition: 'all 0.15s',
                    }} />
                ))}
              </div>

              {loginError && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 12px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={14} color="#f87171" />
                  <span style={{ fontSize: 12, color: '#f87171' }}>{loginError}</span>
                </div>
              )}

              <button onClick={handleMFA} disabled={isLoading || otp.join('').length < 6}
                style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: otp.join('').length < 6 ? 0.6 : 1 }}>
                {isLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><CheckCircle2 size={16} /> Verify & Sign In</>}
              </button>

              <button onClick={() => { setPhase('login'); setOtp(['','','','','','']); }} style={{ width: '100%', marginTop: 12, background: 'none', border: 'none', color: '#5a5a72', fontSize: 12, cursor: 'pointer' }}>
                ← Use different account
              </button>
            </div>
          )}

          {/* ─── Success ─── */}
          {!isLocked && !forgotMode && phase === 'success' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <CheckCircle2 size={48} color="#34d399" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: 18, fontWeight: 700, color: '#34d399' }}>Verified!</div>
              <div style={{ fontSize: 13, color: '#5a5a72', marginTop: 6 }}>Redirecting to your dashboard...</div>
              <div style={{ marginTop: 16, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)', borderRadius: 2, animation: 'expandWidth 1.2s ease forwards' }} />
              </div>
            </div>
          )}

          {/* ─── Main Login Form ─── */}
          {!isLocked && !forgotMode && phase === 'login' && (
            <form onSubmit={handleLogin}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>Welcome back</div>
              <div style={{ fontSize: 13, color: '#5a5a72', marginBottom: 24 }}>Sign in to your workspace</div>

              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: '#9494aa', marginBottom: 6 }}>Email / Username</div>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5a5a72' }} />
                  <input
                    type="email" required value={email} onChange={e => { setEmail(e.target.value); clearError(); }}
                    placeholder="you@annaitech.in" autoComplete="username"
                    style={{
                      width: '100%', padding: '11px 12px 11px 36px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                      transition: 'border 0.2s',
                    }}
                    onFocus={e => (e.target.style.border = '1px solid rgba(99,102,241,0.5)')}
                    onBlur={e => (e.target.style.border = '1px solid rgba(255,255,255,0.1)')}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 12, color: '#9494aa' }}>Password</div>
                  <button type="button" onClick={() => setForgotMode(true)} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 12, cursor: 'pointer', padding: 0 }}>
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5a5a72' }} />
                  <input
                    type={showPw ? 'text' : 'password'} required value={password}
                    onChange={e => { setPassword(e.target.value); clearError(); }}
                    placeholder="••••••••" autoComplete="current-password"
                    style={{
                      width: '100%', padding: '11px 40px 11px 36px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => (e.target.style.border = '1px solid rgba(99,102,241,0.5)')}
                    onBlur={e => (e.target.style.border = '1px solid rgba(255,255,255,0.1)')}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#5a5a72', cursor: 'pointer', padding: 4 }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Failed attempts warning */}
              {failedAttempts > 0 && failedAttempts < 5 && (
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#fbbf24' }}>
                    {failedAttempts} failed attempt{failedAttempts > 1 ? 's' : ''}. Account locks after {5 - failedAttempts} more.
                  </span>
                </div>
              )}

              {/* Error */}
              {loginError && !isLocked && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={14} color="#f87171" />
                  <span style={{ fontSize: 12, color: '#f87171' }}>{loginError}</span>
                </div>
              )}

              {/* Remember Me */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div onClick={() => setRememberMe(!rememberMe)}
                  style={{ width: 16, height: 16, borderRadius: 4, background: rememberMe ? '#6366f1' : 'rgba(255,255,255,0.1)', border: `1px solid ${rememberMe ? '#6366f1' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
                  {rememberMe && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                </div>
                <span style={{ fontSize: 12, color: '#5a5a72' }}>Remember me for 30 days</span>
              </div>

              {/* Submit */}
              <button type="submit" disabled={isLoading}
                style={{
                  width: '100%', padding: '13px', border: 'none', borderRadius: 10, cursor: 'pointer',
                  background: isLoading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 14px rgba(99,102,241,0.35)', transition: 'all 0.2s',
                }}>
                {isLoading
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Authenticating...</>
                  : <>Sign In <ArrowRight size={15} /></>
                }
              </button>

              {/* Demo accounts hint */}
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <button type="button" onClick={() => setShowHints(!showHints)}
                  style={{ background: 'none', border: 'none', color: '#5a5a72', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
                  {showHints ? '▲ Hide' : '▼ Show'} demo accounts
                </button>
              </div>

              {showHints && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {DEMO_HINTS.map(h => (
                    <button key={h.role} type="button" onClick={() => fillDemo(h.email, h.password)}
                      style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 8, padding: '8px 12px', cursor: 'pointer', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: h.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: '#9494aa', fontWeight: 600 }}>{h.role}:</span>
                      <span style={{ fontSize: 11, color: '#5a5a72', fontFamily: 'monospace' }}>{h.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <div style={{ fontSize: 11, color: '#3a3a4e' }}>© 2026 AnnaiTech Solutions Pvt. Ltd. · v2.0</div>
          <div style={{ fontSize: 10, color: '#2e2e42', marginTop: 4 }}>🔒 TLS 1.3 · AES-256 Encrypted · SOC 2 Compliant</div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); } to { transform: rotate(360deg); }
        }
        @keyframes expandWidth {
          from { width: 0; } to { width: 100%; }
        }
        input::placeholder { color: #3a3a52; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #0a0a14 inset !important;
          -webkit-text-fill-color: #fff !important;
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0a14' }} />}>
      <LoginPageContent />
    </Suspense>
  );
}
