import React from 'react';
import { Calendar, Shield, CheckCircle, ArrowRight, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      background: 'rgba(10, 13, 20, 0.95)',
      marginTop: 'auto',
      padding: '60px 0 30px'
    }}>
      <div className="container">
        {/* Architecture Highlight Banner */}
        <div 
          className="glass-panel" 
          style={{
            padding: '24px 32px',
            marginBottom: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
            background: 'linear-gradient(135deg, rgba(18, 24, 38, 0.9) 0%, rgba(30, 41, 59, 0.6) 100%)',
            border: '1px solid var(--border-highlight)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}>
              <Calendar size={22} color="#818cf8" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                Calendly Authoritative Scheduling Architecture
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                React Website ➔ Calendly Booking ➔ Node/Express Webhook ➔ MongoDB ➔ Google Calendar Sync
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="badge badge-success">
              <span className="pulse-dot online"></span>
              Google Calendar Connected
            </span>
            <span className="badge badge-primary">
              Webhooks Verified
            </span>
          </div>
        </div>

        <div className="grid-4" style={{ marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={18} color="#fff" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>InterviewPrep</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Elite 1-on-1 interview counselling, system design breakdowns, and rigorous mock interviews led by ex-FAANG engineers.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '14px', color: '#fff' }}>Services</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <li><a href="/services" style={{ color: 'inherit' }}>Quick Interview Counselling (15m)</a></li>
              <li><a href="/services" style={{ color: 'inherit' }}>Mock Interview & Training (30m)</a></li>
              <li><a href="/counsellor" style={{ color: 'inherit' }}>System Design & L5/L6 Rubrics</a></li>
              <li><a href="/counsellor" style={{ color: 'inherit' }}>FAANG Resume Alignment</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '14px', color: '#fff' }}>Scheduling Platform</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <li><a href="/book" style={{ color: 'inherit' }}>Calendly Embedded Scheduler</a></li>
              <li><a href="/admin" style={{ color: 'inherit' }}>Calendar Conflict Detection</a></li>
              <li><a href="/admin" style={{ color: 'inherit' }}>Google Calendar 2-Way Sync</a></li>
              <li><a href="/admin" style={{ color: 'inherit' }}>Date Override Availability</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '14px', color: '#fff' }}>Security & Verifications</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              All appointments confirmed via authoritative cryptographic Calendly webhook payloads.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#6ee7b7' }}>
              <CheckCircle size={14} />
              <span>HMAC-SHA256 Signed</span>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.8rem',
          color: 'var(--text-dim)'
        }}>
          <div>
            © {new Date().getFullYear()} InterviewPrep Platform. Built with MERN, Calendly, and Google Calendar.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Calendly Integration Spec</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
