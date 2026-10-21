import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogIn, 
  Mail, 
  KeyRound, 
  ShieldCheck, 
  User, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw,
  Edit2
} from 'lucide-react';

export default function LoginPage() {
  const [authMode, setAuthMode] = useState('otp'); // 'otp' | 'password'
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState('REQUEST'); // 'REQUEST' | 'VERIFY'
  const [devOtpHint, setDevOtpHint] = useState(null);
  
  // Loading & status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);

  const { login, loginWithOtp, sendOtp, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  // Handle Resend Countdown
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Navigate according to user role
  const handleAuthSuccess = (userData) => {
    if (userData.role === 'ADMIN' || userData.role === 'COUNSELLOR') {
      navigate('/admin');
    } else {
      navigate('/student');
    }
  };

  // STEP 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await sendOtp(email.trim());
      setOtpStep('VERIFY');
      setResendTimer(60); // 60s cooldown
      setSuccessMsg(res.message || `Verification code dispatched to ${email}`);
      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
      }
    } catch (err) {
      setError(err.message || 'Failed to dispatch verification code');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP and Login
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp || otp.trim().length < 4) {
      setError('Please enter the 6-digit code received on your email');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const data = await loginWithOtp(email.trim(), otp.trim());
      handleAuthSuccess(data);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Traditional Password Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login(email.trim(), password);
      handleAuthSuccess(data);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Demo Logins
  const handleDemo = async (role) => {
    setError(null);
    setLoading(true);
    try {
      const data = await loginAsDemo(role);
      handleAuthSuccess(data);
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '70px 0 110px' }}>
      <div className="container" style={{ maxWidth: '500px' }}>
        <div 
          className="glass-panel"
          style={{
            padding: '38px',
            border: '1px solid var(--border-highlight)',
            background: 'linear-gradient(135deg, rgba(18, 24, 38, 0.98) 0%, rgba(24, 32, 52, 0.95) 100%)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '26px' }}>
            <h1 style={{ fontSize: '1.9rem', color: '#fff', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              Sign In to InterviewPrep
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Access your interview counselling sessions, Google Meet rooms, and notes
            </p>
          </div>

          {/* Mode Switcher Tabs: Email OTP vs Password */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              padding: '6px',
              background: 'rgba(10, 15, 29, 0.7)',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '24px'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setAuthMode('otp');
                setError(null);
              }}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: authMode === 'otp' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                color: authMode === 'otp' ? '#fff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Mail size={15} />
              <span>Email OTP (Fast)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('password');
                setError(null);
              }}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: authMode === 'password' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                color: authMode === 'password' ? '#fff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <KeyRound size={15} />
              <span>Password Login</span>
            </button>
          </div>

          {/* Notifications */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--danger-bg)', color: '#fda4af', borderRadius: '8px', marginBottom: '18px', fontSize: '0.85rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#6ee7b7', borderRadius: '8px', marginBottom: '18px', fontSize: '0.85rem' }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE 1: EMAIL OTP LOGIN */}
          {authMode === 'otp' && (
            <div>
              {otpStep === 'REQUEST' ? (
                /* STEP 1: Enter Email */
                <form onSubmit={handleSendOtp}>
                  <div className="form-group" style={{ marginBottom: '18px' }}>
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Your Email Address</span>
                      <span style={{ fontSize: '0.72rem', color: '#818cf8' }}>No password required</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="email"
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@domain.com"
                        required
                        autoFocus
                        style={{ paddingLeft: '38px' }}
                      />
                      <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '0.95rem', gap: '8px' }}
                  >
                    <span>{loading ? 'Sending Code...' : 'Send 6-Digit Login Code'}</span>
                    <ArrowRight size={16} />
                  </button>

                  {/* Fast Fill Account Chips */}
                  <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                      OR CLICK TO AUTO-FILL KNOWN ACCOUNT:
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setEmail('parkavi.a@msrit.edu')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                      >
                        <ShieldCheck size={13} color="#818cf8" />
                        Dr. Parkavi A. (Admin)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmail('emily.watson@gmail.com')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                      >
                        <User size={13} color="#38bdf8" />
                        Emily Watson (Student)
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                /* STEP 2: Enter Verification Code */
                <form onSubmit={handleVerifyOtp}>
                  <div style={{ padding: '14px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '10px', border: '1px dashed rgba(99, 102, 241, 0.3)', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Code sent to:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep('REQUEST');
                          setOtp('');
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                        <Edit2 size={11} /> Change Email
                      </button>
                    </div>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                      {email}
                    </div>
                  </div>

                  {/* Dev Code Quick Auto-Fill */}
                  {devOtpHint && (
                    <div 
                      onClick={() => setOtp(devOtpHint)}
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '8px',
                        marginBottom: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                      title="Click to fill OTP code"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#38bdf8' }}>
                        <Sparkles size={14} />
                        <span>Dev Helper Code: <strong style={{ letterSpacing: '2px', color: '#fff' }}>{devOtpHint}</strong></span>
                      </div>
                      <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>Click to Fill</span>
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label className="form-label" style={{ textAlign: 'center', display: 'block', fontSize: '0.85rem' }}>
                      Enter 6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="• • • • • •"
                      maxLength={6}
                      required
                      autoFocus
                      style={{
                        textAlign: 'center',
                        fontSize: '1.8rem',
                        letterSpacing: '10px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        padding: '12px 16px',
                        color: '#38bdf8',
                        borderColor: otp.length === 6 ? '#10b981' : 'var(--border-subtle)'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
                  >
                    <LogIn size={16} />
                    <span>{loading ? 'Verifying Code...' : 'Verify & Sign In'}</span>
                  </button>

                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Didn't receive the code?</span>
                    {resendTimer > 0 ? (
                      <span style={{ color: 'var(--text-dim)' }}>Resend in {resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loading}
                        style={{ background: 'transparent', border: 'none', color: '#818cf8', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <RefreshCw size={12} />
                        Resend Code
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* MODE 2: PASSWORD LOGIN */}
          {authMode === 'password' && (
            <div>
              {/* Quick Demo Credentials Box */}
              <div style={{ padding: '14px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '10px', border: '1px dashed rgba(99, 102, 241, 0.4)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#a5b4fc', marginBottom: '10px' }}>
                  <Sparkles size={14} />
                  <span>One-Click Demo Access:</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemo('ADMIN')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78rem', justifyContent: 'center' }}
                  >
                    <ShieldCheck size={14} color="#818cf8" />
                    Counsellor (Dr. Parkavi)
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemo('STUDENT')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78rem', justifyContent: 'center' }}
                  >
                    <User size={14} color="#38bdf8" />
                    Student (Emily)
                  </button>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '6px', padding: '12px' }}>
                  <LogIn size={16} />
                  <span>{loading ? 'Authenticating...' : 'Sign In with Password'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Footer note */}
          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            New to InterviewPrep?{' '}
            <Link to="/register" style={{ color: '#818cf8', fontWeight: 600 }}>
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
