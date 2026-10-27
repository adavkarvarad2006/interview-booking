import React, { useEffect, useState } from 'react';
import { api, getFileUrl } from '../services/api';
import WebhookSimulatorModal from '../components/WebhookSimulatorModal';
import RescheduleModal from '../components/RescheduleModal';
import CancelModal from '../components/CancelModal';
import AdminReviewDrawer from '../components/AdminReviewDrawer';
import { 
  LayoutDashboard, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Users, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  Search, 
  Filter, 
  Lock, 
  Layers, 
  CalendarX, 
  UserCheck, 
  Video, 
  FileText,
  Download,
  Upload
} from 'lucide-react';

import { 
  getEffectiveAppointmentStatus, 
  hasAppointmentPassed, 
  getAppointmentEndDateTime 
} from '../utils/timeConflict';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, appointments, sessions, availability, students, integration, profile
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [students, setStudents] = useState([]);
  const [integration, setIntegration] = useState(null);
  const [counsellor, setCounsellor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Webhook Simulator Modal state
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  // New Block Date form state (Matching prompt: Date, Reason, [Save])
  const [newBlockDate, setNewBlockDate] = useState('2026-10-20');
  const [newBlockReason, setNewBlockReason] = useState('Personal Work');
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockMessage, setBlockMessage] = useState(null);

  // Session Edit / Create Modal state
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  // Reschedule & Cancel modals
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Admin Review Drawer state for pre-session resume / portfolio context
  const [reviewDrawerAppt, setReviewDrawerAppt] = useState(null);

  // Profile Edit state
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Load all initial data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, apptRes, sessRes, blockRes, studRes, intRes, counsRes] = await Promise.all([
        api.getDashboardStats(),
        api.getAllAppointments(),
        api.getAllSessions(),
        api.getBlockedDates(),
        api.getAllStudents(),
        api.getIntegrationConfig(),
        api.getCounsellorProfile()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (apptRes.success) setAppointments(apptRes.data);
      if (sessRes.success) setSessions(sessRes.data);
      if (blockRes.success) setBlockedDates(blockRes.data);
      if (studRes.success) setStudents(studRes.data);
      if (intRes.success) setIntegration(intRes.data);
      if (counsRes.success) setCounsellor(counsRes.data);
    } catch (err) {
      console.error('[AdminDashboard] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh effective statuses every 30 seconds as time passes
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Filtered Appointments
  const filteredAppointments = appointments.filter((appt) => {
    const effectiveStatus = getEffectiveAppointmentStatus(appt);
    const matchesStatus = statusFilter === 'ALL' || effectiveStatus === statusFilter;
    const matchesSearch = 
      appt.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.sessionTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Authoritative list of upcoming sessions Dr. Parkavi has to conduct
  const upcomingSessionsToTake = appointments
    .filter((appt) => {
      const effectiveStatus = getEffectiveAppointmentStatus(appt);
      return (effectiveStatus === 'SCHEDULED' || effectiveStatus === 'RESCHEDULED') && !hasAppointmentPassed(appt);
    })
    .sort((a, b) => {
      const dateA = getAppointmentEndDateTime(a) || new Date(a.date);
      const dateB = getAppointmentEndDateTime(b) || new Date(b.date);
      return dateA - dateB;
    });

  // Handle Blocking a Date
  const handleBlockDate = async (e) => {
    e.preventDefault();
    setBlockLoading(true);
    setBlockMessage(null);
    try {
      const res = await api.blockDate({
        date: newBlockDate,
        reason: newBlockReason
      });
      if (res.success) {
        setBlockMessage({ type: 'success', text: `Date ${newBlockDate} successfully blocked in availability system!` });
        // Refresh blocked dates and stats
        const [bRes, sRes] = await Promise.all([api.getBlockedDates(), api.getDashboardStats()]);
        if (bRes.success) setBlockedDates(bRes.data);
        if (sRes.success) setStats(sRes.data);
      }
    } catch (err) {
      setBlockMessage({ type: 'error', text: err.message });
    } finally {
      setBlockLoading(false);
    }
  };

  // Handle Unblocking a Date
  const handleUnblockDate = async (id) => {
    if (!window.confirm('Are you sure you want to unblock this date?')) return;
    try {
      await api.unblockDate(id);
      const [bRes, sRes] = await Promise.all([api.getBlockedDates(), api.getDashboardStats()]);
      if (bRes.success) setBlockedDates(bRes.data);
      if (sRes.success) setStats(sRes.data);
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Appointment Status Update (e.g. mark COMPLETED)
  const handleUpdateStatus = async (id, status) => {
    try {
      await api.updateAppointmentStatus(id, { status });
      const [apptRes, statsRes] = await Promise.all([api.getAllAppointments(), api.getDashboardStats()]);
      if (apptRes.success) setAppointments(apptRes.data);
      if (statsRes.success) setStats(statsRes.data);
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Save Session
  const handleSaveSession = async (e) => {
    e.preventDefault();
    try {
      if (editingSession._id) {
        await api.updateSession(editingSession._id, editingSession);
      } else {
        await api.createSession(editingSession);
      }
      setSessionModalOpen(false);
      setEditingSession(null);
      const res = await api.getAllSessions();
      if (res.success) setSessions(res.data);
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Save Counsellor Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(false);
    try {
      await api.updateCounsellorProfile(counsellor);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Loading Admin Portal...</div>
      </div>
    );
  }

  const s = stats?.stats || {
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedSessions: 0,
    cancelledSessions: 0,
    totalStudents: 0
  };

  return (
    <div style={{ padding: '40px 0 100px' }}>
      <div className="container">
        {/* Top Header Bar */}
        <div 
          className="glass-panel"
          style={{
            padding: '24px 32px',
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
            border: '1px solid var(--border-highlight)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.8rem', color: '#fff' }}>
                Counsellor & Admin Dashboard
              </h1>
              <span className="badge badge-primary">Primary: Calendly Engine</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Google Calendar Connected: <strong>{integration?.googleCalendarEmail || 'counsellor.interviews@gmail.com'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {/* Webhook Simulator Trigger */}
            <button
              onClick={() => setSimulatorOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ borderColor: 'rgba(99, 102, 241, 0.4)' }}
            >
              <Sparkles size={16} color="#818cf8" />
              <span>Test Webhook Simulator</span>
            </button>

            <button
              onClick={loadDashboardData}
              className="btn btn-secondary btn-sm"
              title="Refresh Data"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div 
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '32px',
            overflowX: 'auto',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          {[
            { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
            { id: 'schedule', label: `Sessions to Take (${upcomingSessionsToTake.length})`, icon: Clock },
            { id: 'appointments', label: `All Booked Appointments (${appointments.length})`, icon: Calendar },
            { id: 'students', label: `Registered Users (${students.length})`, icon: Users },
            { id: 'sessions', label: `Session Types (${sessions.length})`, icon: Layers },
            { id: 'availability', label: `Blocked Dates (${blockedDates.length})`, icon: CalendarX },
            { id: 'integration', label: 'Calendly & Sync', icon: Settings },
            { id: 'profile', label: 'Counsellor Profile', icon: UserCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.88rem' }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {/* ======================================================== */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Required Dashboard Statistics */}
            <div className="grid-4" style={{ marginBottom: '32px' }}>
              {/* Today's Appointments */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    TODAY'S APPOINTMENTS
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={18} color="#818cf8" />
                  </div>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff' }}>
                  {s.todayAppointments}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '4px' }}>
                  Live slots scheduled for today
                </div>
              </div>

              {/* Upcoming Appointments */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    UPCOMING APPOINTMENTS
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={18} color="#06b6d4" />
                  </div>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8' }}>
                  {s.upcomingAppointments}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Active scheduled via Calendly
                </div>
              </div>

              {/* Completed Sessions */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    COMPLETED SESSIONS
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={18} color="#10b981" />
                  </div>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981' }}>
                  {s.completedSessions}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Successfully conducted
                </div>
              </div>

              {/* Cancelled Sessions */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    CANCELLED SESSIONS
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <XCircle size={18} color="#f43f5e" />
                  </div>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f43f5e' }}>
                  {s.cancelledSessions}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Cancelled via Calendly webhook
                </div>
              </div>
            </div>

            {/* SESSIONS DR. PARKAVI HAS TO TAKE & AT WHAT TIME */}
            <div 
              className="glass-panel" 
              style={{ 
                padding: '30px', 
                marginBottom: '32px', 
                border: '1px solid rgba(99, 102, 241, 0.4)', 
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 27, 75, 0.4))',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}>
                      <Clock size={20} color="#fff" />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.4rem', color: '#fff', letterSpacing: '-0.01em', margin: 0 }}>
                        Sessions Dr. Parkavi Has to Take & At What Time
                      </h2>
                    </div>
                    <span className="badge badge-primary" style={{ fontSize: '0.78rem' }}>
                      {upcomingSessionsToTake.length} Scheduled
                    </span>
                  </div>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '46px' }}>
                    Live sessions scheduled for Dr. Parkavi A. with exact time slot, student details, and direct Google Meet room links.
                  </p>
                </div>

                <button 
                  onClick={() => setActiveTab('schedule')} 
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.82rem' }}
                >
                  Open Full Schedule View ({upcomingSessionsToTake.length})
                </button>
              </div>

              {upcomingSessionsToTake.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
                  <Calendar size={38} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.7 }} />
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '1.05rem', marginBottom: '4px' }}>
                    No Pending Sessions at This Moment
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Your schedule is clear. Whenever students book a slot via Calendly, it will instantly show here.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
                  {upcomingSessionsToTake.map((appt) => (
                    <div 
                      key={appt._id} 
                      style={{
                        padding: '20px',
                        background: 'rgba(11, 17, 33, 0.9)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '16px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                        transition: 'transform 0.2s, border-color 0.2s'
                      }}
                    >
                      <div>
                        {/* Top Timing Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            📅 {appt.date}
                          </span>
                          <span className="badge badge-cyan" style={{ fontSize: '0.8rem', fontWeight: 700, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Clock size={13} />
                            {appt.startTime ? `${appt.startTime}${appt.endTime ? ` - ${appt.endTime}` : ''}` : appt.time || '10:00 AM'}
                          </span>
                        </div>

                        {/* Session Topic */}
                        <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '10px', fontWeight: 700 }}>
                          {appt.sessionTitle || '1-on-1 Interview Counselling'}
                        </h4>

                        {/* Student Details Box */}
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UserCheck size={16} color="#38bdf8" />
                            <span>{appt.studentName}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                            {appt.studentEmail}
                          </div>
                          {appt.topic && (
                            <div style={{ fontSize: '0.8rem', color: '#a5b4fc', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed rgba(255, 255, 255, 0.08)' }}>
                              <strong>Focus:</strong> {appt.topic}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons: Join Meet & Controls */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <a
                            href={appt.googleMeetLink || appt.meetUrl || 'https://meet.google.com/new'}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-primary btn-sm"
                            style={{ 
                              flex: 1, 
                              justifyContent: 'center', 
                              fontSize: '0.82rem', 
                              padding: '10px',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              border: 'none',
                              fontWeight: 700
                            }}
                          >
                            <Video size={15} />
                            <span>Join Google Meet</span>
                          </a>

                          <button
                            onClick={() => setReviewDrawerAppt(appt)}
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '10px 14px',
                              fontSize: '0.82rem',
                              background: 'rgba(99, 102, 241, 0.15)',
                              borderColor: 'rgba(99, 102, 241, 0.4)',
                              color: '#a5b4fc',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            title="View student resume (PDF), portfolio & LinkedIn links"
                          >
                            <FileText size={15} />
                            <span>View Resume</span>
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setSelectedAppointment(appt);
                              setRescheduleModalOpen(true);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '0.78rem' }}
                            title="Reschedule this session"
                          >
                            <Clock size={13} style={{ marginRight: '4px' }} />
                            <span>Reschedule</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedAppointment(appt);
                              setCancelModalOpen(true);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '0.78rem', color: '#f43f5e' }}
                            title="Cancel this session"
                          >
                            <CalendarX size={13} style={{ marginRight: '4px' }} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions & Integration Health */}
            <div className="grid-2" style={{ marginBottom: '32px' }}>
              <div className="glass-panel" style={{ padding: '28px' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '16px' }}>
                  Calendly & Google Calendar Live Engine Status
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Primary Scheduling Engine</span>
                    <span className="badge badge-primary">Calendly (Authoritative)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Google Calendar Sync</span>
                    <span className="badge badge-success">
                      <span className="pulse-dot online"></span>
                      Connected (2-Way Conflict Detection)
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Last Calendly Webhook Event</span>
                    <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: '#a5b4fc' }}>
                      {integration?.lastWebhookEvent || 'invitee.created'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '28px' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '16px' }}>
                  Quick Counsellor Controls
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <button 
                    onClick={() => setActiveTab('availability')}
                    className="btn btn-secondary"
                    style={{ justifyContent: 'flex-start', padding: '14px' }}
                  >
                    <CalendarX size={18} color="#f59e0b" />
                    Block Date
                  </button>
                  <button 
                    onClick={() => setSimulatorOpen(true)}
                    className="btn btn-secondary"
                    style={{ justifyContent: 'flex-start', padding: '14px' }}
                  >
                    <Sparkles size={18} color="#818cf8" />
                    Simulate Webhook
                  </button>
                  <button 
                    onClick={() => setActiveTab('sessions')}
                    className="btn btn-secondary"
                    style={{ justifyContent: 'flex-start', padding: '14px' }}
                  >
                    <Clock size={18} color="#38bdf8" />
                    Manage Sessions
                  </button>
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ justifyContent: 'flex-start', padding: '14px' }}
                  >
                    <ExternalLink size={18} color="#10b981" />
                    Google Calendar
                  </a>
                </div>
              </div>
            </div>

            {/* Recent Appointments Preview */}
            <div className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Recent Scheduled Appointments</h3>
                <button onClick={() => setActiveTab('appointments')} className="btn btn-outline btn-sm">
                  View All ({appointments.length})
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Session</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Resume & Dossier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.slice(0, 5).map((appt) => (
                      <tr key={appt._id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{appt.studentName}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{appt.studentEmail}</div>
                        </td>
                        <td>{appt.sessionTitle}</td>
                        <td>{appt.date}</td>
                        <td>{appt.startTime}</td>
                        <td>
                          <span className="badge badge-cyan">{appt.duration}m</span>
                        </td>
                        <td>
                          {(() => {
                            const effectiveStatus = getEffectiveAppointmentStatus(appt);
                            return (
                              <>
                                {effectiveStatus === 'SCHEDULED' && <span className="badge badge-success">Scheduled</span>}
                                {effectiveStatus === 'COMPLETED' && <span className="badge badge-primary"><CheckCircle size={11} style={{ marginRight: '3px' }} /> Completed</span>}
                                {effectiveStatus === 'CANCELLED' && <span className="badge badge-danger">Cancelled</span>}
                              </>
                            );
                          })()}
                        </td>
                        <td>
                          <button
                            onClick={() => setReviewDrawerAppt(appt)}
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '5px 10px',
                              fontSize: '0.78rem',
                              background: appt.resumeUrl ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                              borderColor: appt.resumeUrl ? '#818cf8' : 'rgba(255, 255, 255, 0.1)',
                              color: appt.resumeUrl ? '#a5b4fc' : '#94a3b8',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontWeight: 600
                            }}
                            title="Open candidate resume & dossier drawer"
                          >
                            <FileText size={13} color={appt.resumeUrl ? '#818cf8' : 'currentColor'} />
                            <span>{appt.resumeUrl ? 'View Resume' : 'Resume Dossier'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: SESSIONS DR. PARKAVI HAS TO TAKE & AT WHAT TIME */}
        {/* ======================================================== */}
        {activeTab === 'schedule' && (
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={20} color="#fff" />
                  </div>
                  <h2 style={{ fontSize: '1.6rem', color: '#fff', margin: 0 }}>
                    Sessions Dr. Parkavi Has to Take & At What Time
                  </h2>
                  <span className="badge badge-primary" style={{ fontSize: '0.8rem' }}>
                    {upcomingSessionsToTake.length} Upcoming
                  </span>
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Chronological schedule of confirmed upcoming counselling sessions, exact time slots, student contacts, and video links.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span className="badge badge-success" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                  Total Sessions Queued: {upcomingSessionsToTake.length}
                </span>
              </div>
            </div>

            {upcomingSessionsToTake.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
                <Clock size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.6 }} />
                <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '8px' }}>
                  No Upcoming Sessions Scheduled
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 20px' }}>
                  Dr. Parkavi has no pending sessions queued right now. All standard Calendly hours are available for students to book.
                </p>
                <button onClick={() => setActiveTab('appointments')} className="btn btn-secondary btn-sm">
                  View Past / Completed Appointments
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time Slot</th>
                      <th>Session Topic</th>
                      <th>Student / User</th>
                      <th>Duration</th>
                      <th>Google Meet</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingSessionsToTake.map((appt) => (
                      <tr key={appt._id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                            {appt.date}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#a5b4fc' }}>
                            Authoritative
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-cyan" style={{ fontSize: '0.85rem', fontWeight: 700, padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={13} />
                            {appt.startTime ? `${appt.startTime}${appt.endTime ? ` - ${appt.endTime}` : ''}` : appt.time || '10:00 AM'}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>
                            {appt.sessionTitle || '1-on-1 Interview Counselling'}
                          </div>
                          {appt.topic && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Focus: {appt.topic}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <UserCheck size={16} color="#38bdf8" />
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#fff' }}>{appt.studentName}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{appt.studentEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-primary">{appt.duration || 45} mins</span>
                        </td>
                        <td>
                          <a
                            href={appt.googleMeetLink || appt.meetUrl || 'https://meet.google.com/new'}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-primary btn-sm"
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '6px', 
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              fontSize: '0.8rem',
                              padding: '6px 12px'
                            }}
                          >
                            <Video size={14} />
                            <span>Join Meet</span>
                          </a>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              onClick={() => setReviewDrawerAppt(appt)}
                              className="btn btn-secondary btn-sm"
                              style={{ 
                                padding: '6px 10px', 
                                fontSize: '0.75rem', 
                                background: 'rgba(99, 102, 241, 0.15)', 
                                borderColor: 'rgba(99, 102, 241, 0.4)', 
                                color: '#a5b4fc', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                fontWeight: 600
                              }}
                              title="View student resume & prep context"
                            >
                              <FileText size={12} />
                              <span>Resume</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAppointment(appt);
                                setRescheduleModalOpen(true);
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                              title="Reschedule session"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAppointment(appt);
                                setCancelModalOpen(true);
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#f43f5e' }}
                              title="Cancel session"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: APPOINTMENTS MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'appointments' && (
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', color: '#fff' }}>Appointment Records</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Confirmed authoritative bookings synchronized via Calendly webhooks
                </div>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
                  <input
                    type="text"
                    placeholder="Search student or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '0.85rem' }}
                  />
                </div>

                <select
                  className="form-select"
                  style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Appointments Table matching exact prompt columns:
                Student, Email, Session, Date, Time, Duration, Status, Calendly Event, Actions */}
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Session</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Resume (PDF)</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No appointments match current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((appt) => (
                      <tr key={appt._id}>
                        <td style={{ fontWeight: 600, color: '#fff' }}>{appt.studentName}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{appt.studentEmail}</td>
                        <td>{appt.sessionTitle}</td>
                        <td>{appt.date}</td>
                        <td>{appt.startTime}</td>
                        <td>
                          <span className="badge badge-cyan">{appt.duration}m</span>
                        </td>
                        <td>
                          {(() => {
                            const effectiveStatus = getEffectiveAppointmentStatus(appt);
                            return (
                              <>
                                {effectiveStatus === 'SCHEDULED' && <span className="badge badge-success">SCHEDULED</span>}
                                {effectiveStatus === 'COMPLETED' && <span className="badge badge-primary"><CheckCircle size={11} style={{ marginRight: '3px' }} /> COMPLETED</span>}
                                {effectiveStatus === 'CANCELLED' && <span className="badge badge-danger">CANCELLED</span>}
                              </>
                            );
                          })()}
                        </td>
                        <td>
                          <button
                            onClick={() => setReviewDrawerAppt(appt)}
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '5px 10px',
                              fontSize: '0.78rem',
                              background: appt.resumeUrl ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                              borderColor: appt.resumeUrl ? '#818cf8' : 'rgba(255, 255, 255, 0.1)',
                              color: appt.resumeUrl ? '#c7d2fe' : '#94a3b8',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontWeight: 600,
                              boxShadow: appt.resumeUrl ? '0 2px 8px rgba(99, 102, 241, 0.2)' : 'none'
                            }}
                            title="Open candidate resume PDF & review drawer"
                          >
                            <FileText size={13} color={appt.resumeUrl ? '#818cf8' : 'currentColor'} />
                            <span>{appt.resumeUrl ? 'View Resume' : 'Resume Dossier'}</span>
                          </button>
                        </td>
                        <td>

                          {(() => {
                            const effectiveStatus = getEffectiveAppointmentStatus(appt);
                            return (
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <button
                                  onClick={() => setReviewDrawerAppt(appt)}
                                  className="btn btn-secondary btn-sm"
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '0.75rem',
                                    background: 'rgba(99, 102, 241, 0.15)',
                                    borderColor: 'rgba(99, 102, 241, 0.4)',
                                    color: '#a5b4fc',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: 600
                                  }}
                                  title="View student resume & dossier"
                                >
                                  <FileText size={12} />
                                  Resume
                                </button>

                                {appt.googleMeetLink && effectiveStatus === 'SCHEDULED' && (
                                  <a
                                    href={appt.googleMeetLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-sm"
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '0.75rem',
                                      background: '#10b981',
                                      borderColor: '#10b981',
                                      color: '#fff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontWeight: 600
                                    }}
                                    title="Host or join Google Meet video call"
                                  >
                                    <Video size={12} />
                                    Meet
                                  </a>
                                )}

                                {effectiveStatus === 'SCHEDULED' && (
                                  <button
                                    onClick={() => handleUpdateStatus(appt._id, 'COMPLETED')}
                                    className="btn btn-outline btn-sm"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                    title="Mark session as completed"
                                  >
                                    Mark Done
                                  </button>
                                )}

                                {effectiveStatus === 'SCHEDULED' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedAppointment(appt);
                                      setRescheduleModalOpen(true);
                                    }}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                                    title="Reschedule session"
                                  >
                                    <RefreshCw size={11} />
                                    Reschedule
                                  </button>
                                )}

                                {effectiveStatus === 'SCHEDULED' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedAppointment(appt);
                                      setCancelModalOpen(true);
                                    }}
                                    className="btn btn-danger btn-sm"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                                    title="Cancel appointment slot"
                                  >
                                    <XCircle size={11} />
                                    Cancel
                                  </button>
                                )}

                                {effectiveStatus === 'COMPLETED' && (
                                  <span style={{ color: '#818cf8', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                    <CheckCircle size={13} />
                                    Completed
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: ADMIN SESSION MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'sessions' && (
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', color: '#fff' }}>Interview Session Types</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Configure 15-minute and 30-minute session metadata, durations, and connected Calendly URLs
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingSession({
                    title: 'System Design Deep-Dive',
                    description: 'Comprehensive 45-minute architectural simulation for L5/L6 senior candidates.',
                    duration: 30,
                    sessionType: 'SYSTEM_DESIGN',
                    calendlyEventUrl: integration?.calendly30MinUrl || 'https://calendly.com/interview-counsellor/30-min-mock-interview-training',
                    status: 'ACTIVE',
                    features: ['Distributed systems whiteboard', 'Scale bottlenecks diagnosis', 'Rubric grading']
                  });
                  setSessionModalOpen(true);
                }}
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} />
                Add Session Type
              </button>
            </div>

            <div className="grid-2">
              {sessions.map((sess) => (
                <div 
                  key={sess._id}
                  className="glass-panel"
                  style={{
                    padding: '24px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span className="badge badge-cyan">{sess.duration} Minutes</span>
                      <span className={`badge ${sess.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                        {sess.status}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '8px' }}>
                      {sess.title}
                    </h3>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '14px' }}>
                      {sess.description}
                    </p>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      <strong>Calendly URL:</strong>
                    </div>
                    <div 
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '6px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        color: '#a5b4fc',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: '16px'
                      }}
                    >
                      {sess.calendlyEventUrl}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      onClick={() => {
                        setEditingSession({ ...sess });
                        setSessionModalOpen(true);
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      <Edit3 size={14} />
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: AVAILABILITY & BLOCKING A DAY */}
        {/* ======================================================== */}
        {activeTab === 'availability' && (
          <div>
            {/* Header explaining Calendly availability requirement */}
            <div 
              className="glass-panel"
              style={{
                padding: '24px 32px',
                marginBottom: '28px',
                border: '1px solid var(--border-highlight)',
                background: 'linear-gradient(135deg, rgba(20, 28, 48, 0.95), rgba(15, 21, 35, 0.95))'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <ShieldCheck size={24} color="#818cf8" />
                <h2 style={{ fontSize: '1.4rem', color: '#fff' }}>
                  Calendar Availability & Date Blocking Engine
                </h2>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Per project requirements: <strong>Calendly is the primary source of truth for availability.</strong> When you block a date here, the system ensures that the date cannot be booked through Calendly. Calendly reads the counsellor's connected Google Calendar for "Busy" blocker events and removes all available slots for that day.
              </p>
            </div>

            <div className="grid-2" style={{ alignItems: 'start' }}>
              {/* Block Date Form matching prompt example */}
              <div className="glass-panel" style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '6px' }}>
                  Block Date
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Select a date to make unavailable on Calendly and Google Calendar.
                </p>

                <form onSubmit={handleBlockDate}>
                  <div className="form-group">
                    <label className="form-label">Date (YYYY-MM-DD):</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newBlockDate}
                      onChange={(e) => setNewBlockDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reason:</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Personal Work, Conference, Holiday"
                      value={newBlockReason}
                      onChange={(e) => setNewBlockReason(e.target.value)}
                      required
                    />
                  </div>

                  {blockMessage && (
                    <div 
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '16px',
                        fontSize: '0.85rem',
                        background: blockMessage.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                        color: blockMessage.type === 'success' ? '#6ee7b7' : '#fda4af'
                      }}
                    >
                      {blockMessage.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={blockLoading}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    {blockLoading ? 'Blocking Date...' : '[Save] Block Date'}
                  </button>
                </form>

                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: '1.5' }}>
                  💡 <strong>How Calendly blocks slots:</strong> Calendly's conflict engine continuously monitors your Google Calendar. Any Busy blocker event instantly turns off all 15-min and 30-min booking slots for that entire date.
                </div>
              </div>

              {/* Blocked / Unavailable Dates List */}
              <div className="glass-panel" style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '6px' }}>
                  Currently Blocked Dates ({blockedDates.length})
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Dates where students cannot book appointments.
                </p>

                {blockedDates.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No dates currently blocked. All standard Calendly hours are bookable.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {blockedDates.map((b) => (
                      <div 
                        key={b._id}
                        style={{
                          padding: '16px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{b.date}</span>
                            <span className="badge badge-warning">BLOCKED</span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <strong>Reason:</strong> {b.reason}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6ee7b7', marginTop: '4px' }}>
                            ✓ Calendly availability prevents bookings on this day
                          </div>
                        </div>

                        <button
                          onClick={() => handleUnblockDate(b._id)}
                          className="btn btn-danger btn-sm"
                          title="Remove block and restore availability"
                        >
                          <Trash2 size={14} />
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: STUDENTS DIRECTORY */}
        {/* ======================================================== */}
        {activeTab === 'students' && (
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '6px' }}>Registered Students ({students.length})</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Students created automatically via Calendly booking webhooks or direct platform registration.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Target Roles</th>
                    <th>Appointments Booked</th>
                    <th>Last Booking Date</th>
                    <th>Resume (PDF)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((st) => (
                    <tr key={st._id}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{st.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{st.email}</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(st.targetRoles || ['SWE']).map((r, i) => (
                            <span key={i} className="badge badge-primary" style={{ fontSize: '0.68rem' }}>{r}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-cyan">{st.appointmentCount}</span>
                      </td>
                      <td>{st.lastAppointmentDate || 'None'}</td>
                      <td>
                        {st.resumeUrl ? (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              onClick={() => setReviewDrawerAppt({
                                studentName: st.name,
                                studentEmail: st.email,
                                resumeUrl: st.resumeUrl,
                                resumeFileName: st.resumeFileName || 'Resume.pdf',
                                githubUrl: st.githubUrl || '',
                                linkedinUrl: st.linkedinUrl || '',
                                portfolioUrl: st.portfolioUrl || '',
                                sessionTitle: 'Registered Candidate Dossier',
                                date: st.lastAppointmentDate || 'Registered Student',
                                startTime: 'On-Demand Review',
                                duration: 15
                              })}
                              className="btn btn-secondary btn-sm"
                              style={{
                                padding: '5px 10px',
                                fontSize: '0.78rem',
                                background: 'rgba(99, 102, 241, 0.2)',
                                borderColor: '#818cf8',
                                color: '#a5b4fc',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontWeight: 600
                              }}
                              title="View uploaded student resume PDF"
                            >
                              <FileText size={13} color="#818cf8" />
                              <span>View Resume</span>
                            </button>
                            <a
                              href={getFileUrl(st.resumeUrl)}
                              download={st.resumeFileName || 'Candidate_Resume.pdf'}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '5px 8px', fontSize: '0.78rem' }}
                              title="Download PDF directly"
                            >
                              <Download size={13} />
                            </a>
                          </div>
                        ) : (
                          <button
                            onClick={() => setReviewDrawerAppt({
                              studentName: st.name,
                              studentEmail: st.email,
                              resumeUrl: '',
                              resumeFileName: '',
                              githubUrl: st.githubUrl || '',
                              linkedinUrl: st.linkedinUrl || '',
                              portfolioUrl: st.portfolioUrl || '',
                              sessionTitle: 'Registered Candidate Dossier',
                              date: st.lastAppointmentDate || 'Registered Student',
                              startTime: 'On-Demand Review',
                              duration: 15
                            })}
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.74rem',
                              color: 'var(--text-dim)',
                              background: 'transparent',
                              border: '1px dashed rgba(255, 255, 255, 0.15)'
                            }}
                            title="Attach PDF on behalf of candidate"
                          >
                            <Upload size={12} style={{ marginRight: '4px' }} />
                            <span>Attach PDF</span>
                          </button>
                        )}
                      </td>
                      <td>
                        {st.lastAppointmentStatus === 'SCHEDULED' ? (
                          <span className="badge badge-success">Active Booking</span>
                        ) : (
                          <span className="badge badge-secondary">Idle</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: CALENDLY & GOOGLE CALENDAR INTEGRATION SETTINGS */}
        {/* ======================================================== */}
        {activeTab === 'integration' && (
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', color: '#fff' }}>Calendly & Google Calendar Hub</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Authoritative webhook endpoint and calendar synchronization settings
                </div>
              </div>
              <button onClick={() => setSimulatorOpen(true)} className="btn btn-primary btn-sm">
                <Sparkles size={16} />
                Open Webhook Simulator
              </button>
            </div>

            <div className="grid-2">
              <div>
                <div className="form-group">
                  <label className="form-label">Active Webhook Callback URL (Send this to Calendly Developer Portal):</label>
                  <div style={{ padding: '12px 16px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#a5b4fc' }}>
                    http://localhost:5000/api/calendly/webhook
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Calendly 15-Minute Event URL (VITE_CALENDLY_15_MIN_URL):</label>
                  <input
                    type="text"
                    className="form-input"
                    value={integration?.calendly15MinUrl || ''}
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Calendly 30-Minute Event URL (VITE_CALENDLY_30_MIN_URL):</label>
                  <input
                    type="text"
                    className="form-input"
                    value={integration?.calendly30MinUrl || ''}
                    readOnly
                  />
                </div>
              </div>

              <div>
                <div className="form-group">
                  <label className="form-label">Connected Google Calendar Account:</label>
                  <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className="pulse-dot online"></span>
                      <strong style={{ color: '#fff' }}>{integration?.googleCalendarEmail}</strong>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Synchronized via Calendly Calendar Connections. All bookings on Calendly automatically appear in this calendar with video call links.
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Cryptographic Webhook Signature Status:</label>
                  <div style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 600, color: '#6ee7b7', marginBottom: '4px' }}>
                      HMAC SHA-256 Signature Verification Active
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Header <code>Calendly-Webhook-Signature</code> is strictly verified against configured signing secret.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 7: COUNSELLOR PROFILE */}
        {/* ======================================================== */}
        {activeTab === 'profile' && counsellor && (
          <div className="glass-panel" style={{ padding: '32px', maxWidth: '800px' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '8px' }}>Counsellor Profile Editor</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Update your public title, bio, and expertise areas shown to students on the website.
            </p>

            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label className="form-label">Professional Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={counsellor.title || ''}
                  onChange={(e) => setCounsellor({ ...counsellor, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Headline</label>
                <input
                  type="text"
                  className="form-input"
                  value={counsellor.headline || ''}
                  onChange={(e) => setCounsellor({ ...counsellor, headline: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Biography</label>
                <textarea
                  className="form-textarea"
                  value={counsellor.bio || ''}
                  onChange={(e) => setCounsellor({ ...counsellor, bio: e.target.value })}
                  rows={4}
                />
              </div>

              {profileSuccess && (
                <div style={{ padding: '10px 14px', background: 'var(--success-bg)', color: '#6ee7b7', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                  ✓ Profile updated successfully!
                </div>
              )}

              <button type="submit" disabled={profileSaving} className="btn btn-primary">
                {profileSaving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Webhook Simulator Modal */}
      <WebhookSimulatorModal
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        onWebhookSuccess={() => {
          loadDashboardData();
        }}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={rescheduleModalOpen}
        onClose={() => {
          setRescheduleModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onSuccess={() => {
          loadDashboardData();
        }}
      />

      {/* Cancel Modal */}
      <CancelModal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onSuccess={() => {
          loadDashboardData();
        }}
      />

      {/* Admin Review Drawer (Pre-Session Context & Resume) */}
      <AdminReviewDrawer
        isOpen={!!reviewDrawerAppt}
        onClose={() => setReviewDrawerAppt(null)}
        appointment={reviewDrawerAppt}
        onUpdateAppointment={(updatedAppt) => {
          setReviewDrawerAppt(updatedAppt);
          setAppointments((prev) =>
            prev.map((a) => (a._id === updatedAppt._id ? { ...a, ...updatedAppt } : a))
          );
        }}
        onOpenReschedule={(appt) => {
          setSelectedAppointment(appt);
          setRescheduleModalOpen(true);
        }}
      />

      {/* Edit Session Modal */}
      {sessionModalOpen && editingSession && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 8, 15, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '32px', background: '#0e1424' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '16px' }}>
              {editingSession._id ? 'Edit Interview Session' : 'Create New Session'}
            </h3>

            <form onSubmit={handleSaveSession}>
              <div className="form-group">
                <label className="form-label">Session Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingSession.title}
                  onChange={(e) => setEditingSession({ ...editingSession, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Duration (Minutes)</label>
                  <select
                    className="form-select"
                    value={editingSession.duration}
                    onChange={(e) => setEditingSession({ ...editingSession, duration: Number(e.target.value) })}
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={editingSession.status}
                    onChange={(e) => setEditingSession({ ...editingSession, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Calendly Event URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={editingSession.calendlyEventUrl}
                  onChange={(e) => setEditingSession({ ...editingSession, calendlyEventUrl: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={editingSession.description}
                  onChange={(e) => setEditingSession({ ...editingSession, description: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setSessionModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
