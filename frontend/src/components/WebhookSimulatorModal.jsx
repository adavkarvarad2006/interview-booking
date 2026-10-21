import React, { useState } from 'react';
import { api } from '../services/api';
import { X, Sparkles, Send, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function WebhookSimulatorModal({ isOpen, onClose, onWebhookSuccess }) {
  const [eventType, setEventType] = useState('invitee.created');
  const [studentName, setStudentName] = useState('Michael Chang');
  const [studentEmail, setStudentEmail] = useState('michael.chang@mit.edu');
  const [duration, setDuration] = useState(15);
  const [date, setDate] = useState('2026-10-22');
  const [time, setTime] = useState('15:00');
  const [reason, setReason] = useState('Schedule conflict with university exam');
  const [loading, setLoading] = useState(false);
  const [responseLog, setResponseLog] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSimulate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponseLog(null);

    try {
      const res = await api.simulateWebhook({
        eventType,
        studentName,
        studentEmail,
        duration: Number(duration),
        date,
        time,
        reason
      });

      setResponseLog(res);
      if (onWebhookSuccess) {
        onWebhookSuccess(res);
      }
    } catch (err) {
      setError(err.message || 'Webhook simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '30px',
          border: '1px solid var(--border-highlight)',
          position: 'relative',
          background: 'rgba(15, 21, 35, 0.98)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Calendly Webhook Simulator</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Test authoritative POST /api/calendly/webhook handling end-to-end
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSimulate}>
          <div className="form-group">
            <label className="form-label">Calendly Event Type</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setEventType('invitee.created')}
                className={`btn btn-sm ${eventType === 'invitee.created' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
              >
                invitee.created (New Booking)
              </button>
              <button
                type="button"
                onClick={() => setEventType('invitee.canceled')}
                className={`btn btn-sm ${eventType === 'invitee.canceled' ? 'btn-danger' : 'btn-secondary'}`}
                style={{ flex: 1 }}
              >
                invitee.canceled (Cancellation)
              </button>
            </div>
          </div>

          {eventType === 'invitee.created' ? (
            <>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Student Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Student Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Session Duration</label>
                  <select
                    className="form-select"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  >
                    <option value={15}>15 Minutes (Counselling)</option>
                    <option value={30}>30 Minutes (Mock Interview)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="form-group">
              <label className="form-label">Cancellation Reason</label>
              <input
                type="text"
                className="form-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Will find an existing scheduled appointment in database and mark it as CANCELLED.
              </div>
            </div>
          )}

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: 'var(--danger-bg)',
              color: '#fda4af',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px',
              fontSize: '0.85rem'
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {responseLog && (
            <div style={{
              padding: '14px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6ee7b7', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>
                <CheckCircle2 size={16} />
                Webhook Response 200 OK
              </div>
              <pre style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: '#cbd5e1',
                overflowX: 'auto',
                background: '#090d16',
                padding: '8px 12px',
                borderRadius: '6px'
              }}>
                {JSON.stringify(responseLog, null, 2)}
              </pre>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Close
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Dispatch Webhook Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
