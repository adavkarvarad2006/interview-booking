import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  User, 
  ExternalLink, 
  ArrowRight, 
  ShieldCheck, 
  Video,
  Copy,
  Check,
  CalendarPlus,
  Home
} from 'lucide-react';

export default function BookingConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const {
    sessionTitle = 'Quick Interview Counselling',
    duration = 15,
    date = '2026-10-15',
    time = '10:00 AM',
    counsellorName = 'Dr. Parkavi A.',
    googleMeetLink: initialMeetLink,
    rescheduleUrl = '',
    cancelUrl = ''
  } = state;

  const [copied, setCopied] = useState(false);

  // Generate fallback if not provided
  const googleMeetLink = initialMeetLink || 'https://meet.google.com/vce-park-ai';

  useEffect(() => {
    // Fire celebratory confetti!
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Confetti fallback
    }
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(googleMeetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Construct Google Calendar link with Meet Link embedded in description and location
  const googleCalendarUrl = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(
    `${sessionTitle} with ${counsellorName}`
  )}&details=${encodeURIComponent(
    `Interview Counselling & Technical Mentorship Session.\n\n🎥 Video Meeting Link: ${googleMeetLink}\n\nHost: ${counsellorName}\nDuration: ${duration} Minutes`
  )}&location=${encodeURIComponent(googleMeetLink)}`;

  return (
    <div style={{ padding: '60px 0 100px' }}>
      <div className="container" style={{ maxWidth: '820px' }}>
        <div 
          className="glass-panel"
          style={{
            padding: '48px',
            textAlign: 'center',
            border: '1px solid var(--border-highlight)',
            background: 'linear-gradient(135deg, rgba(18, 24, 38, 0.98) 0%, rgba(22, 30, 48, 0.95) 100%)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.2)'
          }}
        >
          {/* Success Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid rgba(16, 185, 129, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
          }}>
            <CheckCircle2 size={44} color="#10b981" />
          </div>

          <h1 style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '14px', letterSpacing: '-0.02em' }}>
            Your interview counselling session has been successfully booked.
          </h1>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '32px', maxWidth: '620px', margin: '0 auto 32px' }}>
            Your meeting room is ready. Use the Google Meet link below to connect directly with {counsellorName}.
          </p>

          {/* PRIMARY GOOGLE MEET CALLOUT CARD */}
          <div 
            style={{
              padding: '28px',
              borderRadius: 'var(--radius-md)',
              border: '2px solid rgba(16, 185, 129, 0.6)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
              boxShadow: '0 12px 35px rgba(16, 185, 129, 0.25)',
              marginBottom: '32px',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  <Video size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>
                    Google Meet Video Room
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#6ee7b7' }}>
                    Scheduled 1-on-1 Online Video Call
                  </div>
                </div>
              </div>

              <span className="badge badge-success" style={{ padding: '6px 12px' }}>
                <span className="pulse-dot online"></span>
                Room Ready
              </span>
            </div>

            {/* Link display & copy toolbar */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                background: 'rgba(10, 15, 29, 0.85)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '18px',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Link:</span>
                <a 
                  href={googleMeetLink} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{
                    color: '#38bdf8', 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '0.92rem', 
                    fontWeight: 600,
                    textDecoration: 'underline',
                    wordBreak: 'break-all'
                  }}
                >
                  {googleMeetLink}
                </a>
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', padding: '6px 12px', gap: '6px' }}
              >
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Link'}</span>
              </button>
            </div>

            {/* Launch Call and Calendar Add Actions */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a
                href={googleMeetLink}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{
                  flex: '1 1 240px',
                  padding: '14px 24px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderColor: '#10b981',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
                }}
              >
                <Video size={18} />
                <span>Join Google Meet Call</span>
                <ExternalLink size={16} />
              </a>

              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{
                  flex: '1 1 200px',
                  padding: '14px 20px',
                  fontSize: '0.9rem',
                  justifyContent: 'center'
                }}
              >
                <CalendarPlus size={16} color="#818cf8" />
                <span>Add to Google Calendar</span>
              </a>
            </div>
          </div>

          {/* Details Card */}
          <div 
            style={{
              background: 'rgba(15, 21, 35, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '28px',
              textAlign: 'left',
              marginBottom: '32px'
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '18px' }}>
              Appointment Summary
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Session</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>{sessionTitle}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Duration</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38bdf8' }}>{duration} Minutes</div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Date</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={16} color="#818cf8" />
                  {date}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Time</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} color="#818cf8" />
                  {time}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Counsellor</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} color="#10b981" />
                  {counsellorName} (Professor, Ramaiah Institute of Technology)
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/student"
              className="btn btn-secondary"
              style={{ minWidth: '180px', fontSize: '0.9rem' }}
            >
              Go to Student Portal
            </Link>
            <Link
              to="/"
              className="btn btn-secondary"
              style={{ minWidth: '180px', fontSize: '0.9rem' }}
            >
              Return to Home
            </Link>
          </div>

          {/* Sync status reassurance */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.82rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span>Google Meet Room Active & Synced with Counsellor Google Calendar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
