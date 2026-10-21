import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Clock, Calendar, CheckCircle, ArrowRight, ShieldCheck, Zap, HelpCircle } from 'lucide-react';

export default function ServicesPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.getPublicSessions();
        if (res.success) setSessions(res.data);
      } catch (err) {
        console.error('Failed to load sessions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  return (
    <div style={{ padding: '60px 0 100px' }}>
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 60px' }}>
          <span className="badge badge-primary" style={{ marginBottom: '14px' }}>
            INTERVIEW COUNSELLING SERVICES
          </span>
          <h1 style={{ fontSize: '2.8rem', marginBottom: '16px' }}>
            Structured Preparation For High-Stakes Tech Rounds
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
            Choose between rapid targeted counselling or full technical mock interview simulations. All sessions are scheduled directly on Calendly and synchronized with Google Calendar.
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid-2" style={{ marginBottom: '60px' }}>
          {sessions.map((sess) => (
            <div 
              key={sess._id}
              className="glass-panel"
              style={{
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: sess.duration === 30 ? '1px solid var(--border-highlight)' : '1px solid var(--border-subtle)',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span className="badge badge-cyan" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                    <Clock size={14} />
                    {sess.duration} Minutes
                  </span>
                  <span className="badge badge-primary">{sess.badge || 'Official Track'}</span>
                </div>

                <h2 style={{ fontSize: '1.9rem', marginBottom: '16px', color: '#fff' }}>
                  {sess.title}
                </h2>

                <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: '1.7', marginBottom: '32px' }}>
                  {sess.description}
                </p>

                <div style={{ marginBottom: '36px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    What Is Included In This Session:
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(sess.features || []).map((feat, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '0.95rem', color: '#cbd5e1' }}>
                        <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <div style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '24px',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)'
                }}>
                  <div style={{ fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                    Calendly Powered Scheduling:
                  </div>
                  Working hours, date availability, and conflict detection are handled automatically by Calendly.
                </div>

                <Link
                  to={`/book?session=${sess._id}&duration=${sess.duration}`}
                  className={`btn ${sess.duration === 30 ? 'btn-primary' : 'btn-secondary'} btn-lg`}
                  style={{ width: '100%' }}
                >
                  <Calendar size={18} />
                  Book {sess.duration}-Min Slot on Calendly
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Preparation Guidelines */}
        <div 
          className="glass-panel"
          style={{
            padding: '40px',
            border: '1px solid var(--border-subtle)',
            background: 'linear-gradient(135deg, rgba(15, 21, 35, 0.9) 0%, rgba(20, 28, 45, 0.8) 100%)'
          }}
        >
          <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '16px' }}>
            How To Prepare For Your Session
          </h3>
          <div className="grid-3" style={{ marginTop: '20px' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#818cf8', marginBottom: '8px' }}>1. Have Your Resume Ready</div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Ensure your latest resume PDF is accessible. For 15-min sessions, have specific bullets or projects you want feedback on.
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>2. Specify Target Roles</div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Whether you are aiming for Google L4, Meta E5, or a Series-A startup, tailoring your practice scenario ensures maximum relevance.
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>3. Test Your Audio & Setup</div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Google Meet link is automatically included in your Calendly calendar invite and confirmed in your student dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
