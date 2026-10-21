import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  User, 
  Bell, 
  Target, 
  Briefcase, 
  FileText,
  Plus,
  Video
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, isStudent } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments'); // appointments, goals, notifications

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [appRes, notifRes] = await Promise.all([
          api.getMyAppointments(),
          api.getNotifications().catch(() => ({ data: [] }))
        ]);

        if (appRes.success) setAppointments(appRes.data);
        if (notifRes.data) setNotifications(notifRes.data);
      } catch (err) {
        console.error('Error fetching student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return <span className="badge badge-success"><span className="pulse-dot online"></span> Confirmed</span>;
      case 'COMPLETED':
        return <span className="badge badge-primary">Completed</span>;
      case 'CANCELLED':
        return <span className="badge badge-danger">Cancelled</span>;
      default:
        return <span className="badge badge-warning">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Loading Student Dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        {/* Welcome Header */}
        <div 
          className="glass-panel"
          style={{
            padding: '32px',
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
            border: '1px solid var(--border-highlight)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '1.5rem',
              fontWeight: 700
            }}>
              {user ? user.name.charAt(0) : 'S'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.8rem', color: '#fff' }}>
                  Welcome back, {user ? user.name : 'Student'}!
                </h1>
                <span className="badge badge-primary">Student Portal</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                Track your Calendly interview counselling sessions and preparation roadmap.
              </p>
            </div>
          </div>

          <Link to="/book" className="btn btn-primary">
            <Plus size={16} />
            Book New Calendly Session
          </Link>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`btn btn-sm ${activeTab === 'appointments' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Calendar size={16} />
            My Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`btn btn-sm ${activeTab === 'goals' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Target size={16} />
            Target Roles & Goals
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`btn btn-sm ${activeTab === 'notifications' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Bell size={16} />
            Notifications ({notifications.filter(n => !n.read).length})
          </button>
        </div>

        {/* TAB 1: Appointments */}
        {activeTab === 'appointments' && (
          <div>
            {appointments.length === 0 ? (
              <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
                <Calendar size={48} color="#64748b" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '8px' }}>
                  No interview sessions scheduled yet
                </h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '460px', margin: '0 auto 24px' }}>
                  Schedule your first 15-minute quick strategy meeting or 30-minute mock interview via our embedded Calendly scheduler.
                </p>
                <Link to="/book" className="btn btn-primary">
                  Book A Session
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {appointments.map((appt) => (
                  <div 
                    key={appt._id}
                    className="glass-panel"
                    style={{
                      padding: '24px 28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '20px',
                      borderLeft: appt.status === 'SCHEDULED' ? '4px solid #10b981' : appt.status === 'CANCELLED' ? '4px solid #f43f5e' : '4px solid #6366f1'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>
                          <Clock size={12} />
                          {appt.duration} Mins
                        </span>
                        {getStatusBadge(appt.status)}
                      </div>

                      <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '6px' }}>
                        {appt.sessionTitle || 'Interview Counselling'}
                      </h3>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} color="#818cf8" />
                          <span>{appt.date}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} color="#818cf8" />
                          <span>{appt.startTime} - {appt.endTime}</span>
                        </div>
                      </div>

                      {appt.notes && (
                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '10px', background: 'rgba(255, 255, 255, 0.02)', padding: '6px 12px', borderRadius: '6px' }}>
                          <strong>Notes:</strong> {appt.notes}
                        </div>
                      )}

                      {appt.cancellationReason && (
                        <div style={{ fontSize: '0.8rem', color: '#fda4af', marginTop: '8px' }}>
                          <strong>Cancellation Reason:</strong> {appt.cancellationReason}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {appt.googleMeetLink && appt.status === 'SCHEDULED' && (
                        <a
                          href={appt.googleMeetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{
                            background: '#10b981',
                            borderColor: '#10b981',
                            color: '#fff',
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          <Video size={14} />
                          <span>Join Google Meet</span>
                        </a>
                      )}

                      {appt.rescheduleUrl && appt.status === 'SCHEDULED' && (
                        <a
                          href={appt.rescheduleUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          <span>Reschedule</span>
                          <ExternalLink size={12} />
                        </a>
                      )}

                      {appt.cancelUrl && appt.status === 'SCHEDULED' && (
                        <a
                          href={appt.cancelUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-danger btn-sm"
                        >
                          <span>Cancel Slot</span>
                          <ExternalLink size={12} />
                        </a>
                      )}

                      {appt.googleCalendarEventUrl && (
                        <a
                          href={appt.googleCalendarEventUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline btn-sm"
                          title="Open Calendar Event"
                        >
                          Google Calendar
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Target Roles & Goals */}
        {activeTab === 'goals' && (
          <div className="glass-panel" style={{ padding: '36px' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '8px' }}>
              Your Interview Focus Areas
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
              These goals are shared with your counsellor before every session to maximize meeting effectiveness.
            </p>

            <div className="grid-2">
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '12px' }}>
                <div style={{ fontWeight: 600, color: '#818cf8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={16} />
                  Target Companies
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['Google', 'Meta', 'Amazon', 'Microsoft', 'Bloomberg', 'Stripe'].map((c, i) => (
                    <span key={i} className="badge badge-primary">{c}</span>
                  ))}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '12px' }}>
                <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target size={16} />
                  Target Roles & Levels
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['Software Engineer (L4)', 'Senior Backend Engineer (L5)', 'Full Stack Developer'].map((r, i) => (
                    <span key={i} className="badge badge-cyan">{r}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Notifications */}
        {activeTab === 'notifications' && (
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '16px' }}>
              System & Calendly Alerts
            </h3>
            {notifications.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No recent notifications.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {notifications.map((n) => (
                  <div 
                    key={n._id}
                    style={{
                      padding: '14px 18px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px'
                    }}
                  >
                    <Bell size={18} color="#818cf8" />
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{n.title}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{n.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
