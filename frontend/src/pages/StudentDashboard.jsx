import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getFileUrl } from '../services/api';
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
  Video,
  RefreshCw,
  Upload,
  Trash2,
  Download,
  Globe,
  Save,
  Eye
} from 'lucide-react';
import RescheduleModal from '../components/RescheduleModal';
import CancelModal from '../components/CancelModal';
import { getEffectiveAppointmentStatus } from '../utils/timeConflict';

export default function StudentDashboard() {
  const { user, isStudent } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments'); // appointments, resume, goals, notifications
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [toast, setToast] = useState(null);
  const [, setTick] = useState(0);

  // Resume & Pre-session Context State
  const [studentProfile, setStudentProfile] = useState({
    resumeUrl: '',
    resumeFileName: '',
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    preparationNotes: '',
    targetRoles: ['Software Engineer', 'Full Stack Developer'],
    targetCompanies: ['Google', 'Amazon', 'Microsoft']
  });
  const [uploadingResume, setUploadingResume] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [pdfPreviewModal, setPdfPreviewModal] = useState(null); // url to preview

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAppointmentRescheduled = (updatedAppt) => {
    setAppointments((prev) =>
      prev.map((a) => (a._id === updatedAppt._id ? updatedAppt : a))
    );
    showToast(`Session successfully rescheduled to ${updatedAppt.date} at ${updatedAppt.startTime}!`);
  };

  const handleAppointmentCancelled = (updatedAppt) => {
    setAppointments((prev) =>
      prev.map((a) => (a._id === updatedAppt._id ? updatedAppt : a))
    );
    showToast('Your session slot has been cancelled.', 'info');
  };

  const handleUploadResumeFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Please select a valid PDF document (*.pdf)', 'info');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      showToast('File size exceeds the 12MB limit.', 'info');
      return;
    }

    setUploadingResume(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await api.uploadResume({
          fileName: file.name,
          fileData: reader.result
        });

        if (res.success && res.data) {
          setStudentProfile((prev) => ({
            ...prev,
            resumeUrl: res.data.resumeUrl,
            resumeFileName: res.data.resumeFileName
          }));

          // Synchronize in-memory appointments
          setAppointments((prev) =>
            prev.map((a) => ({
              ...a,
              resumeUrl: a.resumeUrl || res.data.resumeUrl,
              resumeFileName: a.resumeFileName || res.data.resumeFileName
            }))
          );

          showToast('Resume PDF uploaded and linked to upcoming sessions!');
        }
      } catch (err) {
        showToast(err.message || 'Failed to upload resume', 'info');
      } finally {
        setUploadingResume(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteResume = async () => {
    if (!window.confirm('Are you sure you want to remove your uploaded resume?')) return;
    try {
      await api.deleteResume();
      setStudentProfile((prev) => ({
        ...prev,
        resumeUrl: '',
        resumeFileName: ''
      }));
      setAppointments((prev) =>
        prev.map((a) => ({
          ...a,
          resumeUrl: '',
          resumeFileName: ''
        }))
      );
      showToast('Resume removed successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to remove resume', 'info');
    }
  };

  const handleSaveProfileLinks = async (e) => {
    if (e) e.preventDefault();
    setSavingProfile(true);
    try {
      await api.updateProfile({
        studentDetails: {
          githubUrl: studentProfile.githubUrl.trim(),
          linkedinUrl: studentProfile.linkedinUrl.trim(),
          portfolioUrl: studentProfile.portfolioUrl.trim(),
          preparationNotes: studentProfile.preparationNotes
        }
      });
      showToast('Portfolio links and pre-session notes saved!');
    } catch (err) {
      showToast(err.message || 'Failed to save links', 'info');
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [appRes, notifRes, meRes] = await Promise.all([
          api.getMyAppointments(),
          api.getNotifications().catch(() => ({ data: [] })),
          api.getMe().catch(() => null)
        ]);

        if (appRes.success) setAppointments(appRes.data);
        if (notifRes.data) setNotifications(notifRes.data);
        if (meRes?.success && meRes?.data?.profile) {
          setStudentProfile((prev) => ({
            ...prev,
            ...meRes.data.profile,
            githubUrl: meRes.data.profile.githubUrl || '',
            linkedinUrl: meRes.data.profile.linkedinUrl || '',
            portfolioUrl: meRes.data.profile.portfolioUrl || '',
            resumeUrl: meRes.data.profile.resumeUrl || '',
            resumeFileName: meRes.data.profile.resumeFileName || '',
            preparationNotes: meRes.data.profile.preparationNotes || ''
          }));
        }
      } catch (err) {
        console.error('Error fetching student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();

    // Auto-refresh effective statuses every 30 seconds as time passes
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const getStatusBadge = (status, appt) => {
    const effectiveStatus = appt ? getEffectiveAppointmentStatus(appt) : status;
    switch (effectiveStatus) {
      case 'SCHEDULED':
        return <span className="badge badge-success"><span className="pulse-dot online"></span> Confirmed</span>;
      case 'COMPLETED':
        return <span className="badge badge-primary"><CheckCircle size={12} style={{ marginRight: '4px' }} /> Completed</span>;
      case 'CANCELLED':
        return <span className="badge badge-danger">Cancelled</span>;
      default:
        return <span className="badge badge-warning">{effectiveStatus}</span>;
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
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`btn btn-sm ${activeTab === 'appointments' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Calendar size={16} />
            My Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('resume')}
            className={`btn btn-sm ${activeTab === 'resume' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ position: 'relative' }}
          >
            <FileText size={16} />
            Resume & Portfolio
            {studentProfile.resumeUrl ? (
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', marginLeft: '6px' }} title="Resume PDF attached"></span>
            ) : (
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block', marginLeft: '6px' }} title="Resume missing"></span>
            )}
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
                {appointments.map((appt) => {
                  const effectiveStatus = getEffectiveAppointmentStatus(appt);
                  return (
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
                        borderLeft: effectiveStatus === 'SCHEDULED' ? '4px solid #10b981' : effectiveStatus === 'CANCELLED' ? '4px solid #f43f5e' : '4px solid #6366f1'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>
                            <Clock size={12} />
                            {appt.duration} Mins
                          </span>
                          {getStatusBadge(effectiveStatus, appt)}
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

                        {/* Pre-Session Context & Resume Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                          {(appt.resumeUrl || studentProfile.resumeUrl) ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.76rem', color: '#6ee7b7' }}>
                              <FileText size={12} color="#10b981" />
                              <span>Resume Linked ({appt.resumeFileName || studentProfile.resumeFileName || 'PDF'})</span>
                              <button
                                type="button"
                                onClick={() => setPdfPreviewModal(appt.resumeUrl || studentProfile.resumeUrl)}
                                style={{ background: 'none', border: 'none', color: '#a7f3d0', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 2px' }}
                                title="Preview Resume"
                              >
                                <Eye size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveTab('resume')}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.74rem', background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#fcd34d', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <AlertCircle size={11} />
                              Attach Resume (PDF)
                            </button>
                          )}

                          {(appt.githubUrl || studentProfile.githubUrl) && (
                            <a
                              href={(appt.githubUrl || studentProfile.githubUrl).startsWith('http') ? (appt.githubUrl || studentProfile.githubUrl) : `https://${appt.githubUrl || studentProfile.githubUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.74rem', color: '#c7d2fe', textDecoration: 'none' }}
                            >
                              <Globe size={11} /> GitHub
                            </a>
                          )}

                          {(appt.linkedinUrl || studentProfile.linkedinUrl) && (
                            <a
                              href={(appt.linkedinUrl || studentProfile.linkedinUrl).startsWith('http') ? (appt.linkedinUrl || studentProfile.linkedinUrl) : `https://${appt.linkedinUrl || studentProfile.linkedinUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.74rem', color: '#38bdf8', textDecoration: 'none' }}
                            >
                              <Globe size={11} /> LinkedIn
                            </a>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {appt.googleMeetLink && effectiveStatus === 'SCHEDULED' && (
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

                        {effectiveStatus === 'SCHEDULED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAppointment(appt);
                              setRescheduleModalOpen(true);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ gap: '6px' }}
                          >
                            <RefreshCw size={13} />
                            <span>Reschedule</span>
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
                            style={{ gap: '6px' }}
                          >
                            <XCircle size={13} />
                            <span>Cancel Slot</span>
                          </button>
                        )}

                        {effectiveStatus === 'COMPLETED' && (
                          <span
                            className="badge badge-primary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <CheckCircle size={13} />
                            Session Completed
                          </span>
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
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Resume & Portfolio (Pre-Session Context) */}
        {activeTab === 'resume' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '32px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={20} color="#fff" />
                    </div>
                    <h2 style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>
                      Resume & Pre-Session Portfolio Dossier
                    </h2>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, paddingLeft: '46px' }}>
                    Attach your resume (PDF) and portfolio links so Dr. Parkavi A. can review your technical background in the Admin Review Drawer before your Google Meet session.
                  </p>
                </div>

                {studentProfile.resumeUrl && (
                  <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle size={13} />
                    Resume Attached & Ready
                  </span>
                )}
              </div>

              {/* Grid: Resume File Upload on Left, Portfolio Links on Right */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px', alignItems: 'start' }}>
                
                {/* Column 1: Resume Upload & Management */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '24px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} color="#818cf8" />
                    Resume Document (PDF)
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '18px' }}>
                    Single or multi-page technical CV in PDF format (up to 12MB).
                  </p>

                  {studentProfile.resumeUrl ? (
                    <div>
                      {/* Uploaded File Card */}
                      <div
                        style={{
                          padding: '16px 18px',
                          background: 'rgba(99, 102, 241, 0.08)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          marginBottom: '16px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', flexShrink: 0 }}>
                            <FileText size={22} />
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {studentProfile.resumeFileName || 'Resume.pdf'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6ee7b7' }}>
                              PDF Attached • Linked to all sessions
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handleDeleteResume}
                          style={{
                            background: 'rgba(244, 63, 94, 0.15)',
                            border: '1px solid rgba(244, 63, 94, 0.3)',
                            borderRadius: '8px',
                            padding: '8px',
                            color: '#f43f5e',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Remove uploaded resume"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Resume Action Buttons */}
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
                        <button
                          type="button"
                          onClick={() => setPdfPreviewModal(getFileUrl(studentProfile.resumeUrl))}
                          className="btn btn-primary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Eye size={14} />
                          <span>Preview PDF</span>
                        </button>

                        <a
                          href={getFileUrl(studentProfile.resumeUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <ExternalLink size={14} />
                          <span>Open in New Tab</span>
                        </a>

                        <a
                          href={getFileUrl(studentProfile.resumeUrl)}
                          download={studentProfile.resumeFileName || 'Resume.pdf'}
                          className="btn btn-outline btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Download size={14} />
                          <span>Download</span>
                        </a>
                      </div>

                      {/* Replace File Button */}
                      <div>
                        <label
                          className="btn btn-secondary btn-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: uploadingResume ? 'not-allowed' : 'pointer',
                            opacity: uploadingResume ? 0.7 : 1
                          }}
                        >
                          <Upload size={14} />
                          <span>{uploadingResume ? 'Uploading...' : 'Replace with New Resume (PDF)'}</span>
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleUploadResumeFile}
                            disabled={uploadingResume}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    /* Dropzone / Upload Box */
                    <div>
                      <label
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '36px 20px',
                          border: '2px dashed rgba(99, 102, 241, 0.4)',
                          borderRadius: '12px',
                          background: 'rgba(99, 102, 241, 0.03)',
                          cursor: uploadingResume ? 'not-allowed' : 'pointer',
                          transition: 'border-color 0.2s, background 0.2s'
                        }}
                      >
                        <div
                          style={{
                            width: '54px',
                            height: '54px',
                            borderRadius: '14px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#818cf8',
                            marginBottom: '14px'
                          }}
                        >
                          <Upload size={26} />
                        </div>
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>
                          {uploadingResume ? 'Processing & Uploading PDF...' : 'Click to Upload Resume PDF'}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                          Supported file format: .pdf (Maximum size: 12MB)
                        </div>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleUploadResumeFile}
                          disabled={uploadingResume}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Column 2: Portfolio, GitHub, LinkedIn & Prep Context */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '24px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={18} color="#38bdf8" />
                    Online Profiles & Portfolios
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '18px' }}>
                    Provide links to your GitHub code samples, LinkedIn profile, or personal website.
                  </p>

                  <form onSubmit={handleSaveProfileLinks} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Globe size={14} color="#818cf8" />
                        GitHub Profile URL
                      </label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://github.com/your-username"
                        value={studentProfile.githubUrl}
                        onChange={(e) => setStudentProfile({ ...studentProfile, githubUrl: e.target.value })}
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Globe size={14} color="#38bdf8" />
                        LinkedIn Profile URL
                      </label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://linkedin.com/in/your-profile"
                        value={studentProfile.linkedinUrl}
                        onChange={(e) => setStudentProfile({ ...studentProfile, linkedinUrl: e.target.value })}
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Globe size={14} color="#34d399" />
                        Personal Portfolio / Website URL
                      </label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://yourportfolio.dev"
                        value={studentProfile.portfolioUrl}
                        onChange={(e) => setStudentProfile({ ...studentProfile, portfolioUrl: e.target.value })}
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: '6px' }}>
                        Pre-Session Focus Notes / Questions for Dr. Parkavi
                      </label>
                      <textarea
                        rows={3}
                        className="form-control"
                        placeholder="e.g. Need feedback on system design round for Google L4, resume bullet phrasing for backend experience..."
                        value={studentProfile.preparationNotes}
                        onChange={(e) => setStudentProfile({ ...studentProfile, preparationNotes: e.target.value })}
                        style={{ fontSize: '0.85rem', resize: 'vertical' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="btn btn-primary"
                      style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}
                    >
                      <Save size={15} />
                      <span>{savingProfile ? 'Saving Details...' : 'Save Profile & Pre-Session Links'}</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Target Roles & Goals */}
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

        {/* Floating Toast Notification */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              bottom: '30px',
              right: '30px',
              padding: '12px 20px',
              borderRadius: '8px',
              background: toast.type === 'info' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(16, 185, 129, 0.95)',
              color: '#fff',
              border: toast.type === 'info' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(16, 185, 129, 0.4)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              zIndex: 9999,
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              animation: 'fadeIn 0.2s ease-in'
            }}
          >
            {toast.type === 'info' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span>{toast.msg}</span>
          </div>
        )}

        {/* Reschedule Modal */}
        <RescheduleModal
          isOpen={rescheduleModalOpen}
          onClose={() => {
            setRescheduleModalOpen(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          onSuccess={handleAppointmentRescheduled}
        />

        {/* Cancel Modal */}
        <CancelModal
          isOpen={cancelModalOpen}
          onClose={() => {
            setCancelModalOpen(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          onSuccess={handleAppointmentCancelled}
        />

        {/* PDF Preview Modal */}
        {pdfPreviewModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(5, 8, 20, 0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={() => setPdfPreviewModal(null)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '850px',
                height: '85vh',
                background: '#0f172a',
                borderRadius: '16px',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 600 }}>
                  <FileText size={18} color="#818cf8" />
                  <span>Resume PDF Preview</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <a
                    href={getFileUrl(pdfPreviewModal)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ExternalLink size={13} /> Open Tab
                  </a>
                  <button
                    onClick={() => setPdfPreviewModal(null)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px',
                      color: '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, background: '#1e293b' }}>
                <object
                  data={`${getFileUrl(pdfPreviewModal)}#toolbar=1`}
                  type="application/pdf"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                >
                  <iframe
                    src={`${getFileUrl(pdfPreviewModal)}#toolbar=1`}
                    title="Resume Preview"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </object>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
