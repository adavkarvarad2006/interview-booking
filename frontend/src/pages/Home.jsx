import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Star, 
  Award, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Code, 
  Layers, 
  Sparkles,
  Users,
  Compass
} from 'lucide-react';

export default function Home() {
  const [sessions, setSessions] = useState([]);
  const [counsellor, setCounsellor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessRes, counsRes] = await Promise.all([
          api.getPublicSessions(),
          api.getCounsellorProfile()
        ]);
        if (sessRes.success) setSessions(sessRes.data);
        if (counsRes.success) setCounsellor(counsRes.data);
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Hero Section */}
      <section style={{ paddingTop: '60px', paddingBottom: '60px', position: 'relative' }}>
        <div className="container">
          <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <span className="badge badge-primary">
                <Sparkles size={12} />
                PROFESSOR & ACADEMIC COUNSELLOR
              </span>
              <span className="badge badge-cyan">
                RAMAIAH INSTITUTE OF TECHNOLOGY
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.03em' }}>
              Expert Technical Mentorship With <span className="gradient-text">Dr. Parkavi A.</span>
            </h1>

            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '36px' }}>
              Book 1-on-1 interview counselling, academic research guidance, or mock technical sessions with Dr. Parkavi A., Professor in CSE(AI & ML) and CSE(CS).
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/book" className="btn btn-primary btn-lg">
                <Calendar size={18} />
                Book Your Calendly Session
              </Link>
              <Link to="/counsellor" className="btn btn-secondary btn-lg">
                View Faculty Profile & Research
                <ArrowRight size={18} />
              </Link>
            </div>

            {/* Social Proof Stats */}
            <div 
              className="glass-panel" 
              style={{
                marginTop: '60px',
                padding: '24px 32px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '20px',
                textAlign: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#818cf8' }}>21+ Yrs</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Teaching & Research</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8' }}>112+</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Research Publications</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>18</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Patents (3 Granted)</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f472b6' }}>50+</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Student Projects Guided</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Counsellor Profile Spotlight */}
      {counsellor && (
        <section style={{ padding: '60px 0', position: 'relative' }}>
          <div className="container">
            <div 
              className="glass-panel"
              style={{
                padding: '40px',
                border: '1px solid var(--border-highlight)',
                background: 'linear-gradient(135deg, rgba(18, 24, 38, 0.9) 0%, rgba(24, 32, 52, 0.8) 100%)'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '36px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={counsellor.avatar || '/dr-parkavi.jpg'}
                    alt={counsellor.name}
                    style={{
                      width: '180px',
                      height: '180px',
                      borderRadius: '24px',
                      objectFit: 'cover',
                      border: '2px solid rgba(99, 102, 241, 0.5)',
                      boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap'
                  }}>
                    <span className="badge badge-success" style={{ boxShadow: 'var(--shadow-sm)' }}>
                      <span className="pulse-dot online"></span>
                      Accepting Bookings
                    </span>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#fff' }}>{counsellor.name}</h2>
                    <span className="badge badge-primary">Sole Lead Counsellor</span>
                  </div>
                  <div style={{ fontSize: '1.05rem', color: '#a5b4fc', fontWeight: 600, marginBottom: '14px' }}>
                    {counsellor.title}
                  </div>
                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '20px' }}>
                    {counsellor.headline || counsellor.bio}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                    {(counsellor.expertiseAreas || []).map((area, idx) => (
                      <span key={idx} className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                        {area}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <Link to="/book" className="btn btn-primary btn-sm">
                      <Clock size={16} />
                      Book with Dr. Parkavi A.
                    </Link>
                    <Link to="/counsellor" className="btn btn-secondary btn-sm">
                      Full Profile & Research Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Interview Sessions Section (15m vs 30m) */}
      <section style={{ padding: '60px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 48px' }}>
            <span className="badge badge-primary" style={{ marginBottom: '12px' }}>
              OFFICIAL SESSION TYPES
            </span>
            <h2 style={{ fontSize: '2.4rem', marginBottom: '16px' }}>
              Choose Your Interview Preparation Track
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Calendly handles real-time slot generation, date conflict avoidance, and instant booking confirmations for both durations.
            </p>
          </div>

          <div className="grid-2">
            {sessions.map((sess) => (
              <div 
                key={sess._id} 
                className="glass-panel glass-panel-hover"
                style={{
                  padding: '36px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: sess.duration === 30 ? '1px solid var(--border-highlight)' : '1px solid var(--border-subtle)',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span className="badge badge-cyan">
                      <Clock size={12} />
                      {sess.duration} Minutes
                    </span>
                    <span className="badge badge-primary">{sess.badge || 'Official Track'}</span>
                  </div>

                  <h3 style={{ fontSize: '1.6rem', marginBottom: '12px', color: '#fff' }}>
                    {sess.title}
                  </h3>

                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '24px' }}>
                    {sess.description}
                  </p>

                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '12px' }}>
                      Session Highlights:
                    </div>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {(sess.features || []).map((feat, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#cbd5e1' }}>
                          <CheckCircle size={16} color="#10b981" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Scheduling Platform
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a5b4fc' }}>
                      Calendly Inline Scheduler
                    </span>
                  </div>
                  <Link 
                    to={`/book?session=${sess._id}&duration=${sess.duration}`} 
                    className={`btn ${sess.duration === 30 ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ width: '100%' }}
                  >
                    <Calendar size={16} />
                    Schedule {sess.duration}-Min Session on Calendly
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Visualizer Section */}
      <section style={{ padding: '60px 0', background: 'rgba(15, 21, 35, 0.4)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 40px' }}>
            <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>
              SYSTEM ARCHITECTURE
            </span>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '16px' }}>
              How Calendly & Google Calendar Power The MERN Flow
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Calendly serves as the primary, authoritative scheduling platform. The MERN system validates and records confirmed appointments via cryptographically signed webhooks.
            </p>
          </div>

          <div 
            className="glass-panel" 
            style={{ 
              padding: '36px', 
              border: '1px solid var(--border-highlight)',
              background: 'linear-gradient(135deg, rgba(10, 13, 20, 0.95), rgba(18, 24, 38, 0.95))'
            }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '16px',
              alignItems: 'center',
              textAlign: 'center'
            }}>
              {/* Step 1 */}
              <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>💻</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>1. Student Browser</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Selects 15m or 30m session on React portal
                </div>
              </div>

              {/* Arrow */}
              <div style={{ color: '#818cf8', fontSize: '1.4rem' }}>➔</div>

              {/* Step 2 */}
              <div style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📅</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#818cf8' }}>2. Calendly Engine</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Live slot selection, conflict check & booking
                </div>
              </div>

              {/* Arrow */}
              <div style={{ color: '#06b6d4', fontSize: '1.4rem' }}>➔</div>

              {/* Step 3 */}
              <div style={{ padding: '20px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>⚡</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#38bdf8' }}>3. Node Webhook</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Authoritative HMAC sync & MongoDB record
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '24px',
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="#10b981" />
                Automatic Google Calendar Sync for Counsellor
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="#10b981" />
                No custom slot collisions or duplicate engines
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="#10b981" />
                Instant Reschedule & Cancellation via Calendly
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '60px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 40px' }}>
            <span className="badge badge-primary" style={{ marginBottom: '12px' }}>
              PROVEN RESULTS
            </span>
            <h2 style={{ fontSize: '2.2rem' }}>Student Success Offers</h2>
          </div>

          <div className="grid-3">
            <div className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', gap: '4px', color: '#f59e0b', marginBottom: '14px' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#f59e0b" />)}
              </div>
              <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '18px' }}>
                "The 30-minute mock interview was remarkably close to the actual Google L5 system design round. Dr. Vance pinpointed my weakness in distributed cache eviction immediately."
              </p>
              <div>
                <div style={{ fontWeight: 700, color: '#fff' }}>Emily Watson</div>
                <div style={{ fontSize: '0.8rem', color: '#38bdf8' }}>L5 Software Engineer @ Google</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', gap: '4px', color: '#f59e0b', marginBottom: '14px' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#f59e0b" />)}
              </div>
              <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '18px' }}>
                "Booking a 15-minute quick counselling before my Meta on-site gave me the exact confidence boost and behavioral story structure I needed to secure an E5 offer."
              </p>
              <div>
                <div style={{ fontWeight: 700, color: '#fff' }}>David Chen</div>
                <div style={{ fontSize: '0.8rem', color: '#38bdf8' }}>Senior SWE @ Meta</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', gap: '4px', color: '#f59e0b', marginBottom: '14px' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#f59e0b" />)}
              </div>
              <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '18px' }}>
                "The Calendly integration on this website is butter-smooth. Scheduled at 10 AM, had it on my Google Calendar immediately, and received prompt feedback afterwards."
              </p>
              <div>
                <div style={{ fontWeight: 700, color: '#fff' }}>Sophia Rodriguez</div>
                <div style={{ fontSize: '0.8rem', color: '#38bdf8' }}>Backend Engineer @ Stripe</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
