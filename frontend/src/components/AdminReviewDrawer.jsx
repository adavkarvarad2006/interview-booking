import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  ExternalLink, 
  Download, 
  Video, 
  Clock, 
  Calendar, 
  User, 
  Briefcase, 
  Target, 
  CheckCircle, 
  Globe, 
  AlertCircle,
  Edit2,
  Save,
  Upload,
  RefreshCw
} from 'lucide-react';
import { api, getFileUrl, getAppointmentResumeUrl } from '../services/api';

export default function AdminReviewDrawer({ 
  isOpen, 
  onClose, 
  appointment, 
  onUpdateAppointment,
  onOpenReschedule 
}) {
  const [activeView, setActiveView] = useState('resume'); // 'resume', 'context', 'notes'
  const [currentAppt, setCurrentAppt] = useState(appointment);
  const [prepNotes, setPrepNotes] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSavedToast, setNotesSavedToast] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => {
    setCurrentAppt(appointment);
    if (appointment) {
      setPrepNotes(appointment.notes || '');
      setGithubUrl(appointment.githubUrl || '');
      setLinkedinUrl(appointment.linkedinUrl || '');
      setPortfolioUrl(appointment.portfolioUrl || '');
      setIsEditingLinks(false);

      // If appointment lacks resumeUrl, query backend to fetch freshly synced student resume
      if (isOpen && appointment._id && appointment.sessionTitle !== 'Registered Candidate Dossier' && !appointment.resumeUrl) {
        api.getAppointment(appointment._id).then(res => {
          if (res?.success && res?.data) {
            setCurrentAppt(res.data);
            if (onUpdateAppointment) {
              onUpdateAppointment(res.data);
            }
          }
        }).catch(err => {
          console.warn('[AdminReviewDrawer] Could not fetch fresh appointment:', err);
        });
      }
    }
  }, [appointment, isOpen]);



  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !appointment) return null;

  // Save updated pre-session links & notes
  const handleSaveContext = async () => {
    setSavingNotes(true);
    try {
      const res = await api.updateAppointmentContext(appointment._id, {
        notes: prepNotes,
        githubUrl: githubUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        portfolioUrl: portfolioUrl.trim()
      });
      if (res.success && res.data) {
        if (onUpdateAppointment) {
          onUpdateAppointment(res.data);
        }
        setIsEditingLinks(false);
        setNotesSavedToast(true);
        setTimeout(() => setNotesSavedToast(false), 3000);
      }
    } catch (err) {
      console.error('[Review Drawer] Error saving context:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  // Upload resume directly from drawer
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a valid PDF document.');
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
        const base64 = reader.result;
        const res = await api.uploadResume({
          fileName: file.name,
          fileData: base64,
          appointmentId: appointment.sessionTitle !== 'Registered Candidate Dossier' ? appointment._id : undefined,
          studentEmail: appointment.studentEmail || undefined
        });


        if (res.success && res.data) {
          const updated = {
            ...(currentAppt || appointment),
            resumeUrl: res.data.resumeUrl,
            resumeFileName: res.data.resumeFileName
          };
          setCurrentAppt(updated);
          if (onUpdateAppointment) {
            onUpdateAppointment(updated);
          }
        }
      } catch (err) {
        alert(err.message || 'Failed to upload resume PDF');
      } finally {
        setUploadingResume(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const activeAppt = currentAppt || appointment;
  const rawResumeUrl = activeAppt?.resumeUrl || activeAppt?.sessionId?.resumeUrl || '';
  const resumeUrl = rawResumeUrl;
  const effectiveResumeUrl = rawResumeUrl ? getFileUrl(rawResumeUrl) : (activeAppt?._id ? getAppointmentResumeUrl(activeAppt._id) : '');
  const resumeFileName = activeAppt?.resumeFileName || (rawResumeUrl ? rawResumeUrl.split('/').pop() : 'Candidate_Resume.pdf');
  const meetLink = activeAppt?.googleMeetLink || activeAppt?.meetUrl || 'https://meet.google.com/new';

  let embedUrl = effectiveResumeUrl;
  if (embedUrl.includes('drive.google.com') && embedUrl.includes('/view')) {
    embedUrl = embedUrl.replace(/\/view(\?.*)?$/, '/preview');
  }



  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 8, 20, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          height: '100vh',
          backgroundColor: '#0c1322',
          borderLeft: '1px solid rgba(99, 102, 241, 0.35)',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '24px 28px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '1.4rem',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
              }}
            >
              {appointment.studentName?.charAt(0) || 'S'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.3rem', color: '#fff', margin: 0, fontWeight: 700 }}>
                  {appointment.studentName}
                </h2>
                <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                  Pre-Session Dossier
                </span>
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {appointment.studentEmail}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s, color 0.2s'
            }}
            title="Close Drawer (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Appointment Timing & Video Bar */}
        <div
          style={{
            padding: '16px 28px',
            background: 'rgba(99, 102, 241, 0.08)',
            borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#e0e7ff' }}>
              {appointment.sessionTitle || '1-on-1 Interview Mentorship'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.8rem', color: '#94a3b8', marginTop: '3px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={13} color="#818cf8" />
                {appointment.date}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={13} color="#818cf8" />
                {appointment.startTime} - {appointment.endTime || 'End'} ({appointment.duration || 15}m)
              </span>
            </div>
          </div>

          <a
            href={meetLink}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary btn-sm"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderColor: '#10b981',
              fontWeight: 700,
              fontSize: '0.84rem',
              padding: '8px 16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}
          >
            <Video size={15} />
            <span>Enter Google Meet</span>
          </a>
        </div>

        {/* Navigation Tabs inside Drawer */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(15, 23, 42, 0.5)',
            padding: '0 28px'
          }}
        >
          <button
            onClick={() => setActiveView('resume')}
            style={{
              padding: '14px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeView === 'resume' ? '2px solid #818cf8' : '2px solid transparent',
              color: activeView === 'resume' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FileText size={16} color={activeView === 'resume' ? '#818cf8' : 'currentColor'} />
            Resume (PDF)
            {resumeUrl && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }}></span>}
          </button>

          <button
            onClick={() => setActiveView('context')}
            style={{
              padding: '14px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeView === 'context' ? '2px solid #818cf8' : '2px solid transparent',
              color: activeView === 'context' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Target size={16} color={activeView === 'context' ? '#818cf8' : 'currentColor'} />
            Portfolio & Target Goals
          </button>

          <button
            onClick={() => setActiveView('notes')}
            style={{
              padding: '14px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeView === 'notes' ? '2px solid #818cf8' : '2px solid transparent',
              color: activeView === 'notes' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Edit2 size={15} color={activeView === 'notes' ? '#818cf8' : 'currentColor'} />
            Counsellor Prep Notes
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          
          {/* VIEW 1: RESUME PDF */}
          {activeView === 'resume' && (
            <div>
              {rawResumeUrl ? (
                <div>
                  {/* File Info Bar */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '12px 18px',
                      borderRadius: '10px',
                      marginBottom: '16px',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#f87171'
                        }}
                      >
                        <FileText size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>
                          {resumeFileName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Document Attached • Portable Document Format
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <label
                        className="btn btn-primary btn-sm"
                        style={{
                          fontSize: '0.8rem',
                          padding: '6px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          cursor: uploadingResume ? 'not-allowed' : 'pointer',
                          opacity: uploadingResume ? 0.7 : 1
                        }}
                        title="Upload a new PDF to replace this candidate's resume"
                      >
                        <Upload size={13} />
                        <span>{uploadingResume ? 'Uploading...' : 'Replace PDF'}</span>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleFileUpload}
                          disabled={uploadingResume}
                          style={{ display: 'none' }}
                        />
                      </label>
                      <a
                        href={effectiveResumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <ExternalLink size={13} />
                        Open Tab
                      </a>
                      <a
                        href={effectiveResumeUrl}
                        download={resumeFileName}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Download size={13} />
                        Download
                      </a>
                    </div>
                  </div>

                  {/* Embedded PDF Viewer */}
                  <div
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      background: '#1e293b',
                      height: '520px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <object
                      data={`${embedUrl}#toolbar=1&navpanes=0`}
                      type="application/pdf"
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        background: '#ffffff'
                      }}
                    >
                      <iframe
                        src={`${embedUrl}#toolbar=1&navpanes=0`}
                        title="Candidate Resume"
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          background: '#ffffff'
                        }}
                      >
                        <div style={{ padding: '32px 20px', textAlign: 'center', color: '#fff', background: '#0f172a', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={40} color="#818cf8" style={{ marginBottom: '16px' }} />
                          <h4 style={{ color: '#fff', marginBottom: '8px' }}>Resume Ready to View</h4>
                          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px', maxWidth: '380px' }}>
                            Click below to open or download the candidate's uploaded resume PDF in a dedicated viewer tab.
                          </p>
                          <a
                            href={effectiveResumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                          >
                            <ExternalLink size={16} />
                            Open Candidate Resume PDF
                          </a>
                        </div>
                      </iframe>
                    </object>
                  </div>
                </div>
              ) : (

                /* Empty state when student hasn't uploaded a resume yet */
                <div
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed rgba(255, 255, 255, 0.12)',
                    borderRadius: '14px'
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '16px',
                      background: 'rgba(99, 102, 241, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      color: '#818cf8'
                    }}
                  >
                    <FileText size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '8px' }}>
                    No Resume PDF Attached Yet
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', maxWidth: '420px', margin: '0 auto 24px', lineHeight: '1.5' }}>
                    The student hasn't uploaded their resume PDF directly. You can inspect their GitHub/LinkedIn links under the <strong>Portfolio</strong> tab, or attach a PDF received via email below.
                  </p>

                  <label
                    className="btn btn-primary btn-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: uploadingResume ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Upload size={14} />
                    <span>{uploadingResume ? 'Attaching PDF...' : 'Attach Resume PDF on Behalf'}</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileUpload}
                      disabled={uploadingResume}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: PORTFOLIO, SOCIAL LINKS & TARGET GOALS */}
          {activeView === 'context' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Online Links Section */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={16} color="#38bdf8" />
                    Online Profiles & Portfolios
                  </div>
                  <button
                    onClick={() => setIsEditingLinks(!isEditingLinks)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    {isEditingLinks ? 'Cancel' : 'Edit Links'}
                  </button>
                </div>

                {isEditingLinks ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                        GitHub Profile URL
                      </label>
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username"
                        className="form-control"
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                        LinkedIn Profile URL
                      </label>
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        className="form-control"
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                        Personal Portfolio / Website
                      </label>
                      <input
                        type="url"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        placeholder="https://portfolio.dev"
                        className="form-control"
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                    <button
                      onClick={handleSaveContext}
                      disabled={savingNotes}
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: '8px', alignSelf: 'flex-start' }}
                    >
                      <Save size={14} />
                      <span>{savingNotes ? 'Saving...' : 'Save Links'}</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* GitHub Link */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <span style={{ fontSize: '0.84rem', color: '#cbd5e1', fontWeight: 600 }}>GitHub</span>
                      {githubUrl ? (
                        <a
                          href={githubUrl.startsWith('http') ? githubUrl : `https://${githubUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: '0.82rem',
                            color: '#818cf8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'none'
                          }}
                        >
                          {githubUrl.replace(/^https?:\/\//, '')}
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Not specified</span>
                      )}
                    </div>

                    {/* LinkedIn Link */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <span style={{ fontSize: '0.84rem', color: '#cbd5e1', fontWeight: 600 }}>LinkedIn</span>
                      {linkedinUrl ? (
                        <a
                          href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: '0.82rem',
                            color: '#38bdf8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'none'
                          }}
                        >
                          {linkedinUrl.replace(/^https?:\/\//, '')}
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Not specified</span>
                      )}
                    </div>

                    {/* Portfolio Website */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <span style={{ fontSize: '0.84rem', color: '#cbd5e1', fontWeight: 600 }}>Portfolio</span>
                      {portfolioUrl ? (
                        <a
                          href={portfolioUrl.startsWith('http') ? portfolioUrl : `https://${portfolioUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: '0.82rem',
                            color: '#34d399',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'none'
                          }}
                        >
                          {portfolioUrl.replace(/^https?:\/\//, '')}
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Not specified</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Target Companies & Roles */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={16} color="#818cf8" />
                  Target Roles & Companies
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Target Roles:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(appointment.targetRoles && appointment.targetRoles.length > 0 
                      ? appointment.targetRoles 
                      : ['Software Engineer', 'Full Stack Developer', 'System Design']
                    ).map((r, i) => (
                      <span key={i} className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>{r}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Target Companies:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(appointment.targetCompanies && appointment.targetCompanies.length > 0 
                      ? appointment.targetCompanies 
                      : ['Google', 'Amazon', 'Microsoft', 'Meta']
                    ).map((c, i) => (
                      <span key={i} className="badge badge-primary" style={{ fontSize: '0.75rem' }}>{c}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Student Booking Notes */}
              {appointment.notes && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '20px'
                  }}
                >
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                    Student Session Notes / Question
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: '1.6', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                    {appointment.notes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: COUNSELLOR PREPARATION SCRATCHPAD */}
          {activeView === 'notes' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '4px' }}>
                  Pre-Session Preparation Notes
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Jot down key questions, candidate blockers, or evaluation criteria before initiating the Google Meet call.
                </p>
              </div>

              <textarea
                value={prepNotes}
                onChange={(e) => setPrepNotes(e.target.value)}
                rows={10}
                className="form-control"
                placeholder="Example: Ask about their experience with distributed databases in project X. Review resume bullet 3..."
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '0.88rem',
                  lineHeight: '1.6',
                  fontFamily: 'inherit',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  resize: 'vertical'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={handleSaveContext}
                  disabled={savingNotes}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={14} />
                  <span>{savingNotes ? 'Saving Notes...' : 'Save Preparation Notes'}</span>
                </button>

                {notesSavedToast && (
                  <span style={{ fontSize: '0.82rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={14} /> Saved successfully!
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Quick Actions */}
        <div
          style={{
            padding: '18px 28px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(15, 23, 42, 0.8)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', gap: '10px' }}>
            {onOpenReschedule && (
              <button
                onClick={() => {
                  onClose();
                  onOpenReschedule(appointment);
                }}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', padding: '8px 14px' }}
              >
                <RefreshCw size={13} style={{ marginRight: '5px' }} />
                Reschedule
              </button>
            )}
          </div>

          <a
            href={meetLink}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderColor: '#10b981',
              fontWeight: 700,
              fontSize: '0.88rem',
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
            }}
          >
            <Video size={16} />
            <span>Join Google Meet Call</span>
          </a>
        </div>
      </div>
    </div>
  );
}
