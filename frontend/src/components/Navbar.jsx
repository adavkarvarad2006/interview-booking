import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  User, 
  ShieldCheck, 
  LogOut, 
  LogIn, 
  Menu, 
  X, 
  Sparkles,
  Clock,
  Layers
} from 'lucide-react';

export default function Navbar() {
  const { user, isAdmin, isStudent, logout, loginAsDemo } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar-wrapper" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(10, 13, 20, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '76px'
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)'
          }}>
            <Calendar size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Interview<span style={{ color: '#818cf8' }}>Prep</span>
              </span>
              <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                CALENDLY POWERED
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              1-on-1 FAANG Coaching & Mock Training
            </div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }} className="desktop-nav">
          <Link 
            to="/" 
            style={{ 
              fontSize: '0.95rem', 
              fontWeight: 500,
              color: isActive('/') ? '#818cf8' : 'var(--text-muted)',
              transition: 'color 0.2s'
            }}
          >
            Home
          </Link>
          <Link 
            to="/counsellor" 
            style={{ 
              fontSize: '0.95rem', 
              fontWeight: 500,
              color: isActive('/counsellor') ? '#818cf8' : 'var(--text-muted)',
              transition: 'color 0.2s'
            }}
          >
            Counsellor Profile
          </Link>
          <Link 
            to="/services" 
            style={{ 
              fontSize: '0.95rem', 
              fontWeight: 500,
              color: isActive('/services') ? '#818cf8' : 'var(--text-muted)',
              transition: 'color 0.2s'
            }}
          >
            Sessions & Pricing
          </Link>
          <Link 
            to="/book" 
            style={{ 
              fontSize: '0.95rem', 
              fontWeight: 600,
              color: isActive('/book') ? '#38bdf8' : 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clock size={16} color="#06b6d4" />
            Book Calendly Slot
          </Link>
        </nav>

        {/* Auth & Demo Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Quick Demo Switcher Pill */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDemoMenuOpen(!demoMenuOpen)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem', padding: '6px 12px', border: '1px dashed rgba(99, 102, 241, 0.4)' }}
              title="Switch demo role easily"
            >
              <Sparkles size={14} color="#818cf8" />
              <span>Demo Roles</span>
            </button>

            {demoMenuOpen && (
              <div 
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  width: '240px',
                  padding: '12px',
                  zIndex: 200,
                  border: '1px solid var(--border-highlight)',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                  ONE-CLICK DEMO LOGIN:
                </div>
                <button
                  onClick={async () => {
                    await loginAsDemo('ADMIN');
                    setDemoMenuOpen(false);
                    navigate('/admin');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '6px', fontSize: '0.8rem' }}
                >
                  <ShieldCheck size={14} color="#818cf8" />
                  Counsellor (Admin)
                </button>
                <button
                  onClick={async () => {
                    await loginAsDemo('STUDENT');
                    setDemoMenuOpen(false);
                    navigate('/student');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.8rem' }}
                >
                  <User size={14} color="#38bdf8" />
                  Student (Emily Watson)
                </button>
              </div>
            )}
          </div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isAdmin ? (
                <Link to="/admin" className="btn btn-primary btn-sm">
                  <ShieldCheck size={16} />
                  Admin Dashboard
                </Link>
              ) : (
                <Link to="/student" className="btn btn-primary btn-sm">
                  <User size={16} />
                  Student Portal
                </Link>
              )}
              <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log Out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={16} />
                Sign In
              </Link>
              <Link to="/book" className="btn btn-primary btn-sm">
                Book Session
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-secondary btn-sm mobile-menu-btn"
            style={{ display: 'none' }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div 
          className="glass-panel" 
          style={{ 
            padding: '20px', 
            margin: '8px 16px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link to="/counsellor" onClick={() => setMobileMenuOpen(false)}>Counsellor Profile</Link>
          <Link to="/services" onClick={() => setMobileMenuOpen(false)}>Sessions & Pricing</Link>
          <Link to="/book" onClick={() => setMobileMenuOpen(false)} style={{ color: '#38bdf8' }}>Book Calendly Slot</Link>
          {user && (
            <Link to={isAdmin ? "/admin" : "/student"} onClick={() => setMobileMenuOpen(false)}>
              {isAdmin ? "Admin Dashboard" : "Student Dashboard"}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
