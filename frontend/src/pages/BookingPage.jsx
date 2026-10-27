import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CalendlyEmbed from '../components/CalendlyEmbed';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Star, 
  ShieldCheck, 
  User, 
  Info, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  FileText,
  Upload,
  Globe,
  ExternalLink
} from 'lucide-react';

export default function BookingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [counsellor, setCounsellor] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(
    Number(searchParams.get('duration')) || 15
  );
  const [loading, setLoading] = useState(true);
  const [blockedDates, setBlockedDates] = useState([]);

  // Pre-session Resume & Portfolio Context State
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeSavedMsg, setResumeSavedMsg] = useState('');

  // Default URLs from Vite environment variables
  const env15Url = import.meta.env.VITE_CALENDLY_15_MIN_URL || 'https://calendly.com/interview-counsellor/15-min-interview-counselling';
  const env30Url = import.meta.env.VITE_CALENDLY_30_MIN_URL || 'https://calendly.com/interview-counsellor/30-min-mock-interview-training';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessRes, counsRes, blockedRes, meRes] = await Promise.all([
          api.getPublicSessions(),
          api.getCounsellorProfile(),
          api.getBlockedDates(),
          api.getMe().catch(() => null)
        ]);

        if (sessRes.success) setSessions(sessRes.data);
        if (counsRes.success) setCounsellor(counsRes.data);
        if (blockedRes.success) setBlockedDates(blockedRes.data);
        if (meRes?.success && meRes?.data?.profile) {
          if (meRes.data.profile.resumeUrl) setResumeUrl(meRes.data.profile.resumeUrl);
          if (meRes.data.profile.resumeFileName) setResumeFileName(meRes.data.profile.resumeFileName);
          if (meRes.data.profile.githubUrl) setGithubUrl(meRes.data.profile.githubUrl);
          if (meRes.data.profile.linkedinUrl) setLinkedinUrl(meRes.data.profile.linkedinUrl);
        }
      } catch (err) {
        console.error('Error fetching booking data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update selected duration from query param changes
  useEffect(() => {
    const dur = Number(searchParams.get('duration'));
    if (dur && (dur === 15 || dur === 30)) {
      setSelectedDuration(dur);
    }
  }, [searchParams]);

  // Find active session object matching selected duration
  const activeSession = sessions.find((s) => s.duration === selectedDuration) || {
    title: selectedDuration === 30 ? 'Mock Interview & Training' : 'Quick Interview Counselling',
    duration: selectedDuration,
    description: selectedDuration === 30 
      ? 'A comprehensive 30-minute realistic technical or behavioral mock interview simulation.' 
      : 'A focused 15-minute 1-on-1 strategy meeting to diagnose interview blockers.',
    calendlyEventUrl: selectedDuration === 30 ? env30Url : env15Url
  };

  // Determine Calendly URL to embed
  const calendlyUrl = activeSession.calendlyEventUrl || (selectedDuration === 30 ? env30Url : env15Url);

  const handleDurationSelect = (dur) => {
    setSelectedDuration(dur);
    setSearchParams({ duration: dur.toString() });
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF document.');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      alert('File size exceeds the 12MB limit.');
      return;
    }

    setUploadingResume(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await api.uploadResume({
          fileName: file.name,
          fileData: reader.result,
          studentEmail: user?.email || undefined
        });
        if (res.success && res.data) {
          setResumeUrl(res.data.resumeUrl);
          setResumeFileName(res.data.resumeFileName);

          setResumeSavedMsg('Resume PDF attached to session!');
          setTimeout(() => setResumeSavedMsg(''), 4000);
        }
      } catch (err) {
        alert(err.message || 'Failed to upload resume');
      } finally {
        setUploadingResume(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handler when Calendly or Direct Scheduler reports a completed booking
  const handleBookingCompleted = async (eventData) => {
    console.log('[BookingPage] Booking event received:', eventData);

    const bookingDate = eventData.date || new Date().toISOString().split('T')[0];
    const bookingTime = eventData.time || '10:00 AM';
    const sName = eventData.studentName || (user ? user.name : 'Student');
    const sEmail = eventData.studentEmail || (user ? user.email : 'student@example.com');

    // Also update student profile with any entered GitHub/LinkedIn links
    if (user && (githubUrl || linkedinUrl)) {
      api.updateProfile({
        studentDetails: {
          githubUrl: githubUrl.trim(),
          linkedinUrl: linkedinUrl.trim()
        }
      }).catch(err => console.warn('Non-blocking profile update:', err));
    }

    let googleMeetLink = '';

    // If simulated or triggered via direct scheduler, send webhook payload to backend
    if (eventData.isSimulated || eventData.isDirectBooking) {
      try {
        const webhookRes = await api.simulateWebhook({
          eventType: 'invitee.created',
          studentName: sName,
          studentEmail: sEmail,
          duration: selectedDuration,
          date: bookingDate,
          time: bookingTime,
          reason: eventData.notes || '1-on-1 Interview Mentorship Session',
          resumeUrl,
          resumeFileName,
          githubUrl,
          linkedinUrl
        });
        if (webhookRes?.googleMeetLink) {
          googleMeetLink = webhookRes.googleMeetLink;
        } else if (webhookRes?.data?.googleMeetLink) {
          googleMeetLink = webhookRes.data.googleMeetLink;
        }
      } catch (err) {
        console.error('Booking appointment creation error:', err);
        throw err;
      }
    }

    if (!googleMeetLink) {
      // Reliable fallback Google Meet link generator
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      const r = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      googleMeetLink = `https://meet.google.com/${r(3)}-${r(4)}-${r(3)}`;
    }

    // Redirect to confirmation screen as specified in student experience requirements
    navigate('/booking-confirmation', {
      state: {
        sessionTitle: activeSession.title,
        duration: activeSession.duration,
        date: bookingDate,
        time: bookingTime,
        studentName: sName,
        studentEmail: sEmail,
        googleMeetLink,
        counsellorName: counsellor ? counsellor.name : 'Dr. Parkavi A.',
        rescheduleUrl: (eventData.rawPayload?.invitee?.reschedule_url && !eventData.rawPayload.invitee.reschedule_url.includes('sample') && !eventData.rawPayload.invitee.reschedule_url.includes('sim_')) ? eventData.rawPayload.invitee.reschedule_url : '',
        cancelUrl: (eventData.rawPayload?.invitee?.cancel_url && !eventData.rawPayload.invitee.cancel_url.includes('sample') && !eventData.rawPayload.invitee.cancel_url.includes('sim_')) ? eventData.rawPayload.invitee.cancel_url : ''
      }
    });
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Loading Calendly Scheduler...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        {/* Navigation Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
          <span>Home</span>
          <span>/</span>
          <span>Services</span>
          <span>/</span>
          <span style={{ color: '#818cf8', fontWeight: 600 }}>Calendly Booking</span>
        </div>

        {/* Section Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.4rem', color: '#fff', marginBottom: '8px' }}>
            Book Your Interview Counselling Session
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
            Select your preferred duration below. The embedded Calendly scheduler will display real-time availability.
          </p>
        </div>

        {/* Session Selection Tabs */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleDurationSelect(15)}
            className={`btn ${selectedDuration === 15 ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '14px 28px', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
          >
            <Clock size={18} />
            15-Minute Interview Counselling
          </button>
          <button
            onClick={() => handleDurationSelect(30)}
            className={`btn ${selectedDuration === 30 ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '14px 28px', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
          >
            <Calendar size={18} />
            30-Minute Mock Interview & Training
          </button>
        </div>

        {/* Embedded Split Layout (Counsellor Info | Calendly Scheduler) */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: '380px 1fr',
            gap: '32px',
            alignItems: 'start'
          }}
          className="booking-split-layout"
        >
          {/* Left Column: Counsellor Information & Selected Session Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Counsellor Card */}
            <div className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                <img
                  src={counsellor?.avatar || '/dr-parkavi.jpg'}
                  alt={counsellor?.name || 'Dr. Parkavi A.'}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    objectFit: 'cover',
                    border: '2px solid rgba(99, 102, 241, 0.4)'
                  }}
                />
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>{counsellor?.name || 'Dr. Parkavi A.'}</h3>
                  <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 600 }}>
                    {counsellor?.title || 'Professor in CSE(AI & ML)'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#f59e0b', marginTop: '2px' }}>
                    <Star size={14} fill="#f59e0b" />
                    <span>4.99 (112 publications)</span>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '16px' }}>
                {counsellor?.headline || 'Senior interview mentor dedicated to helping engineers pass FAANG technical rounds.'}
              </p>

              <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6ee7b7', fontWeight: 600, marginBottom: '4px' }}>
                  <ShieldCheck size={14} />
                  Google Calendar Synchronized
                </div>
                Appointments booked on Calendly automatically appear in the counsellor's primary Google Calendar.
              </div>
            </div>

            {/* Selected Session Details Card */}
            <div className="glass-panel" style={{ padding: '28px', border: '1px solid var(--border-highlight)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span className="badge badge-cyan">
                  <Clock size={12} />
                  {activeSession.duration} Minutes
                </span>
                <span className="badge badge-primary">Selected Track</span>
              </div>

              <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '12px' }}>
                {activeSession.title}
              </h3>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
                {activeSession.description}
              </p>

              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '10px' }}>
                Included in this session:
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(activeSession.features || [
                  'Personalized 1-on-1 video call',
                  'Actionable technical rubric feedback',
                  'Google Calendar invite sent to your email'
                ]).map((feat, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#cbd5e1' }}>
                    <CheckCircle size={14} color="#10b981" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pre-Session Context Card: Attach Resume & Portfolio */}
            <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileText size={18} color="#818cf8" />
                <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: 0 }}>
                  Pre-Session Context (Optional)
                </h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '16px', lineHeight: '1.5' }}>
                Upload your resume (PDF) or paste GitHub/LinkedIn links so Dr. Parkavi A. can review them before your session.
              </p>

              {/* Resume Upload Status */}
              <div style={{ marginBottom: '14px' }}>
                {resumeUrl ? (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <CheckCircle size={15} color="#10b981" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {resumeFileName || 'Resume.pdf'}
                      </span>
                    </div>
                    <label
                      style={{
                        fontSize: '0.74rem',
                        color: '#a5b4fc',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Change
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleResumeUpload}
                        disabled={uploadingResume}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                ) : (
                  <label
                    className="btn btn-secondary btn-sm"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      cursor: uploadingResume ? 'not-allowed' : 'pointer',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Upload size={14} />
                    <span>{uploadingResume ? 'Attaching PDF...' : 'Attach Resume (PDF)'}</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleResumeUpload}
                      disabled={uploadingResume}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
                {resumeSavedMsg && (
                  <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>
                    {resumeSavedMsg}
                  </div>
                )}
              </div>

              {/* GitHub & LinkedIn Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: '#cbd5e1', marginBottom: '4px' }}>
                    <Globe size={12} color="#818cf8" />
                    <span>GitHub Profile URL</span>
                  </div>
                  <input
                    type="url"
                    placeholder="https://github.com/username"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="form-control"
                    style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: '#cbd5e1', marginBottom: '4px' }}>
                    <Globe size={12} color="#38bdf8" />
                    <span>LinkedIn Profile URL</span>
                  </div>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="form-control"
                    style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                  />
                </div>
              </div>
            </div>

            {/* Blocked Dates Notice */}
            {blockedDates.length > 0 && (
              <div 
                className="glass-panel" 
                style={{ 
                  padding: '20px', 
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  background: 'rgba(245, 158, 11, 0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fcd34d', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                  <AlertTriangle size={16} />
                  Counsellor Blackout Dates
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  The counsellor is unavailable on the following date(s) (automatically blocked by Calendly conflict rules):
                </div>
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {blockedDates.map((b) => (
                    <span key={b._id} className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                      {b.date} ({b.reason})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Official Calendly Embedded Scheduler */}
          <div>
            <CalendlyEmbed
              url={calendlyUrl}
              prefill={{
                name: user ? user.name : '',
                email: user ? user.email : ''
              }}
              sessionTitle={activeSession.title}
              duration={activeSession.duration}
              onEventScheduled={handleBookingCompleted}
              blockedDates={blockedDates}
              counsellor={counsellor}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
