import React, { useEffect, useRef, useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle,
  CalendarCheck,
  Send,
  Link as LinkIcon,
  HelpCircle,
  User,
  Mail,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { isSlotBooked } from '../utils/timeConflict';

export default function CalendlyEmbed({
  url: initialUrl,
  prefill = {},
  onEventScheduled,
  sessionTitle = 'Interview Counselling Session',
  duration = 15,
  blockedDates = [],
  counsellor = null
}) {
  // Check if initial URL is a placeholder/demo link
  const isPlaceholderUrl = (u) => !u || u.includes('interview-counsellor') || u.includes('sample');

  // Stored custom URL or default
  const [customUrl, setCustomUrl] = useState(() => {
    return localStorage.getItem('custom_calendly_url') || initialUrl || '';
  });
  const [activeUrl, setActiveUrl] = useState(() => {
    const saved = localStorage.getItem('custom_calendly_url');
    return saved || initialUrl || '';
  });

  // Default to Direct In-App Scheduler if URL is placeholder, otherwise Calendly widget
  const [bookingMode, setBookingMode] = useState(() => {
    const saved = localStorage.getItem('custom_calendly_url');
    return (saved && !isPlaceholderUrl(saved)) ? 'calendly' : 'direct';
  });

  const [iframeError, setIframeError] = useState(false);
  const containerRef = useRef(null);

  // Direct Booking Form State
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState('10:00 AM');
  const [studentName, setStudentName] = useState(prefill.name || '');
  const [studentEmail, setStudentEmail] = useState(prefill.email || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [urlInputVisible, setUrlInputVisible] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState(null);

  // Fetch booked slots whenever selectedDate changes
  useEffect(() => {
    let isMounted = true;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSlotError(null);
      try {
        const res = await api.getBookedSlots(selectedDate);
        if (isMounted && res.success) {
          setBookedSlots(res.bookedSlots || []);
        }
      } catch (err) {
        console.warn('Could not fetch booked slots:', err);
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    };
    if (selectedDate) {
      fetchSlots();
    }
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  // Keep student details synced if prefill loads late
  useEffect(() => {
    if (prefill.name && !studentName) setStudentName(prefill.name);
    if (prefill.email && !studentEmail) setStudentEmail(prefill.email);
  }, [prefill.name, prefill.email]);

  // Clean and prepare the Calendly embed URL
  const getEmbedUrl = () => {
    if (!activeUrl) return '';
    try {
      const parsedUrl = new URL(activeUrl);
      parsedUrl.searchParams.set('embed_domain', window.location.hostname);
      parsedUrl.searchParams.set('embed_type', 'Inline');
      parsedUrl.searchParams.set('hide_landing_page_details', '1');
      parsedUrl.searchParams.set('hide_gdpr_banner', '1');
      parsedUrl.searchParams.set('background_color', '121826');
      parsedUrl.searchParams.set('text_color', 'ffffff');
      parsedUrl.searchParams.set('primary_color', '6366f1');

      if (prefill.name) parsedUrl.searchParams.set('name', prefill.name);
      if (prefill.email) parsedUrl.searchParams.set('email', prefill.email);

      return parsedUrl.toString();
    } catch (e) {
      return activeUrl;
    }
  };

  const embedUrl = getEmbedUrl();

  // Listen for official Calendly postMessage events
  useEffect(() => {
    const handleCalendlyMessage = (e) => {
      if (e.data && e.data.event) {
        console.log('[Calendly PostMessage]', e.data.event, e.data.payload);

        if (e.data.event === 'calendly.event_scheduled') {
          const eventPayload = e.data.payload || {};
          if (onEventScheduled) {
            onEventScheduled({
              eventUri: eventPayload.event ? eventPayload.event.uri : null,
              inviteeUri: eventPayload.invitee ? eventPayload.invitee.uri : null,
              rawPayload: eventPayload
            });
          }
        }
      }
    };

    window.addEventListener('message', handleCalendlyMessage);
    return () => window.removeEventListener('message', handleCalendlyMessage);
  }, [onEventScheduled]);

  // Load via official Calendly Javascript API if available
  useEffect(() => {
    if (bookingMode === 'calendly' && window.Calendly && containerRef.current && embedUrl && !isPlaceholderUrl(activeUrl)) {
      try {
        containerRef.current.innerHTML = '';
        window.Calendly.initInlineWidget({
          url: embedUrl,
          parentElement: containerRef.current,
          prefill: prefill
        });
      } catch (err) {
        console.warn('[Calendly Widget Init Error, falling back to iframe]:', err);
      }
    }
  }, [embedUrl, bookingMode, activeUrl]);

  // Generate next 10 bookable days
  const upcomingDays = Array.from({ length: 10 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + 1 + i);
    const dateStr = d.toISOString().split('T')[0];
    const isBlocked = blockedDates.some((b) => b.date === dateStr);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = d.getDate();
    return { dateStr, dayName, monthName, dayNum, isBlocked };
  });

  const timeSlots = [
    '09:30 AM',
    '10:30 AM',
    '11:30 AM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
    '05:00 PM'
  ];

  // Auto-switch selectedTime if currently selected slot is booked
  useEffect(() => {
    if (timeSlots.length > 0) {
      const currentBooked = isSlotBooked(selectedTime, bookedSlots, duration);
      if (currentBooked) {
        const firstAvailable = timeSlots.find((s) => !isSlotBooked(s, bookedSlots, duration));
        setSelectedTime(firstAvailable || '');
      }
    }
  }, [bookedSlots, duration, selectedDate]);

  const handleDirectBooking = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;

    // Client-side conflict guard
    if (isSlotBooked(selectedTime, bookedSlots, duration)) {
      setSlotError(`The ${selectedTime} slot on ${selectedDate} is already booked. Please choose another available time.`);
      return;
    }

    setSubmitting(true);
    setSlotError(null);
    try {
      if (onEventScheduled) {
        await onEventScheduled({
          isDirectBooking: true,
          date: selectedDate,
          time: selectedTime,
          studentName: studentName || 'Student',
          studentEmail: studentEmail || 'student@example.com',
          notes: notes,
          sessionTitle,
          duration
        });
      }
    } catch (err) {
      console.error('Direct booking error:', err);
      setSlotError(err.message || 'Error booking appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCustomUrl = (e) => {
    e.preventDefault();
    if (customUrl) {
      localStorage.setItem('custom_calendly_url', customUrl);
      setActiveUrl(customUrl);
      setBookingMode('calendly');
      setIframeError(false);
      setUrlInputVisible(false);
    }
  };

  const handleResetToDirect = () => {
    localStorage.removeItem('custom_calendly_url');
    setActiveUrl(initialUrl || '');
    setBookingMode('direct');
  };

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Mode Switcher Bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          background: 'rgba(18, 24, 38, 0.95)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setBookingMode('direct')}
            className={`btn btn-sm ${bookingMode === 'direct' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
          >
            <CalendarCheck size={14} />
            Direct Scheduler (Recommended)
          </button>
          <button
            type="button"
            onClick={() => setBookingMode('calendly')}
            className={`btn btn-sm ${bookingMode === 'calendly' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
          >
            <LinkIcon size={14} />
            Calendly Live Link
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setUrlInputVisible(!urlInputVisible)}
            style={{ background: 'transparent', border: 'none', color: '#818cf8', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <LinkIcon size={12} />
            {urlInputVisible ? 'Close Link Config' : 'Configure Calendly URL'}
          </button>
          {activeUrl && (
            <a 
              href={activeUrl} 
              target="_blank" 
              rel="noreferrer"
              style={{ fontSize: '0.78rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              Open in Calendly <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* URL Configuration Dropdown */}
      {urlInputVisible && (
        <form 
          onSubmit={handleSaveCustomUrl}
          style={{
            padding: '14px 18px',
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid var(--border-highlight)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ flex: '1 1 300px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Enter your live Calendly Event URL:
            </label>
            <input
              type="url"
              className="form-input"
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              placeholder="https://calendly.com/your-username/15min"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '8px 16px' }}>
              Save & Load
            </button>
            <button type="button" onClick={handleResetToDirect} className="btn btn-secondary btn-sm" style={{ padding: '8px 12px' }}>
              Reset Default
            </button>
          </div>
        </form>
      )}

      {/* MODE 1: DIRECT IN-APP SCHEDULER */}
      {bookingMode === 'direct' && (
        <div 
          className="glass-panel"
          style={{ 
            padding: '28px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-highlight)',
            background: 'linear-gradient(135deg, rgba(18, 24, 38, 0.98) 0%, rgba(24, 32, 52, 0.95) 100%)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="pulse-dot online"></span>
                <h2 style={{ fontSize: '1.35rem', color: '#fff', margin: 0 }}>
                  Select Date & Time with {counsellor?.name || 'Dr. Parkavi A.'}
                </h2>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                {sessionTitle} • {duration} Minutes 1-on-1 • Synchronized with Google Calendar
              </p>
            </div>
            <span className="badge badge-success">
              <ShieldCheck size={13} />
              Instant Confirmation
            </span>
          </div>

          <form onSubmit={handleDirectBooking}>
            {/* Step 1: Select Date */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <CalendarIcon size={15} color="#818cf8" />
                1. Select Available Date:
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: '8px' }}>
                {upcomingDays.map((d) => (
                  <button
                    key={d.dateStr}
                    type="button"
                    disabled={d.isBlocked}
                    onClick={() => setSelectedDate(d.dateStr)}
                    style={{
                      padding: '10px 6px',
                      borderRadius: '10px',
                      border: selectedDate === d.dateStr 
                        ? '2px solid #6366f1' 
                        : d.isBlocked 
                        ? '1px dashed rgba(239, 68, 68, 0.3)' 
                        : '1px solid var(--border-subtle)',
                      background: selectedDate === d.dateStr 
                        ? 'rgba(99, 102, 241, 0.25)' 
                        : d.isBlocked 
                        ? 'rgba(239, 68, 68, 0.05)' 
                        : 'rgba(255, 255, 255, 0.03)',
                      color: d.isBlocked ? 'rgba(255, 255, 255, 0.3)' : '#fff',
                      cursor: d.isBlocked ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: selectedDate === d.dateStr ? '#a5b4fc' : 'var(--text-muted)' }}>
                      {d.dayName}
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                      {d.dayNum}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: d.isBlocked ? '#ef4444' : 'var(--text-muted)' }}>
                      {d.isBlocked ? 'Blocked' : d.monthName}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Select Time Slot */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={15} color="#818cf8" />
                  2. Select Available Time Slot (IST):
                </label>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  {loadingSlots ? (
                    'Checking availability...'
                  ) : (
                    `${timeSlots.filter((s) => !isSlotBooked(s, bookedSlots, duration)).length} of ${timeSlots.length} available`
                  )}
                </span>
              </div>

              {slotError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#fca5a5',
                    fontSize: '0.85rem',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{slotError}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                {timeSlots.map((slot) => {
                  const booked = isSlotBooked(slot, bookedSlots, duration);
                  const isSelected = selectedTime === slot;

                  if (booked) {
                    return (
                      <div
                        key={slot}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px dashed rgba(239, 68, 68, 0.3)',
                          background: 'rgba(239, 68, 68, 0.05)',
                          color: '#64748b',
                          opacity: 0.6,
                          cursor: 'not-allowed',
                          fontSize: '0.85rem',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '2px'
                        }}
                        title="This time slot is already booked. The counsellor can only take one session at a time."
                      >
                        <span style={{ textDecoration: 'line-through' }}>{slot}</span>
                        <span style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 600 }}>Booked</span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        setSelectedTime(slot);
                        setSlotError(null);
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: isSelected 
                          ? '2px solid #38bdf8' 
                          : '1px solid var(--border-subtle)',
                        background: isSelected 
                          ? 'rgba(56, 189, 248, 0.2)' 
                          : 'rgba(255, 255, 255, 0.03)',
                        color: isSelected ? '#38bdf8' : '#e2e8f0',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: isSelected ? 600 : 400,
                        textAlign: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>

              {timeSlots.every((s) => isSlotBooked(s, bookedSlots, duration)) && !loadingSlots && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <AlertCircle size={16} />
                  <span>All interview counselling slots on this date are fully booked. Please select another date above.</span>
                </div>
              )}
            </div>

            {/* Step 3: Student Details */}
            <div style={{ marginBottom: '24px', padding: '18px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={15} color="#818cf8" />
                3. Your Booking Information:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Emily Watson"
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="e.g. emily.watson@gmail.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Session Focus / Questions (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Resume review for Google SWE, or DSA preparation roadmap"
                />
              </div>
            </div>

            {/* Confirmation & Submit */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Selected: <strong style={{ color: '#fff' }}>{selectedDate}</strong> at <strong style={{ color: '#38bdf8' }}>{selectedTime}</strong>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontSize: '0.95rem' }}
              >
                <CheckCircle2 size={18} />
                {submitting ? 'Confirming Appointment...' : 'Confirm Appointment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODE 2: LIVE CALENDLY WIDGET */}
      {bookingMode === 'calendly' && (
        <div>
          {/* If placeholder URL, show helpful notice */}
          {isPlaceholderUrl(activeUrl) ? (
            <div 
              className="glass-panel"
              style={{
                padding: '32px',
                textAlign: 'center',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                background: 'rgba(245, 158, 11, 0.05)',
                marginBottom: '16px'
              }}
            >
              <AlertCircle size={36} color="#f59e0b" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '8px' }}>
                Calendly Placeholder Link Detected
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 18px', lineHeight: '1.6' }}>
                The URL <code style={{ color: '#fcd34d' }}>{activeUrl}</code> is a demo placeholder. Calendly blocks placeholder links from embedding inside iframes.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setBookingMode('direct')}
                  className="btn btn-primary btn-sm"
                >
                  <CalendarCheck size={16} />
                  Switch to Direct Scheduler (Works Instantly)
                </button>
                <button
                  type="button"
                  onClick={() => setUrlInputVisible(true)}
                  className="btn btn-secondary btn-sm"
                >
                  <LinkIcon size={16} />
                  Enter My Real Calendly URL
                </button>
              </div>
            </div>
          ) : (
            <div 
              className="glass-panel"
              style={{ 
                overflow: 'hidden',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-highlight)',
                minHeight: '680px',
                background: '#0d1322',
                position: 'relative'
              }}
            >
              {iframeError ? (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <AlertCircle size={40} color="#fda4af" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '8px' }}>
                    Unable to Embed Calendly Frame
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 20px' }}>
                    Calendly or your browser privacy settings prevented embedding this URL directly in the page.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <a href={activeUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                      <ExternalLink size={14} /> Open in New Tab
                    </a>
                    <button type="button" onClick={() => setBookingMode('direct')} className="btn btn-secondary btn-sm">
                      Use Direct Scheduler
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  ref={containerRef} 
                  className="calendly-inline-widget"
                  data-url={embedUrl}
                  style={{ minWidth: '320px', height: '700px', width: '100%' }}
                >
                  <iframe
                    src={embedUrl}
                    width="100%"
                    height="700px"
                    frameBorder="0"
                    title="Calendly Scheduling Page"
                    style={{ border: 'none', minHeight: '680px' }}
                    onError={() => setIframeError(true)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instant Testing Helper */}
      <div 
        style={{
          marginTop: '16px',
          padding: '12px 18px',
          background: 'rgba(18, 24, 38, 0.8)',
          border: '1px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#818cf8" />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Quick Test: Simulate instant webhook appointment creation
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (onEventScheduled) {
              onEventScheduled({
                isSimulated: true,
                sessionTitle,
                duration
              });
            }
          }}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.8rem', borderColor: 'rgba(99, 102, 241, 0.4)' }}
        >
          <CheckCircle2 size={14} color="#10b981" />
          Trigger Instant Scheduled Event
        </button>
      </div>
    </div>
  );
}
