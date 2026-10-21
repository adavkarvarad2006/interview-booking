import React, { useState } from 'react';
import { api } from '../services/api';
import { X, AlertTriangle, Calendar, Clock, XCircle, ExternalLink } from 'lucide-react';

function isGenuineCalendlyUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('https://calendly.com/')) return false;
  const lower = url.toLowerCase();
  return (
    !lower.includes('sim_') &&
    !lower.includes('sample') &&
    !lower.includes('evt_seed') &&
    !lower.includes('test') &&
    !lower.endsWith('/sample') &&
    !lower.endsWith('/reschedulings/') &&
    !lower.endsWith('/cancellations/')
  );
}

export default function CancelModal({ isOpen, onClose, appointment, onSuccess }) {
  const [reason, setReason] = useState('Change of plans');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !appointment) return null;

  const hasRealCalendlyLink = isGenuineCalendlyUrl(appointment.cancelUrl);

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.cancelAppointment(appointment._id, {
        reason: reason.trim() || 'Cancelled by student'
      });

      if (res.success) {
        if (onSuccess) {
          onSuccess(res.data);
        }
        onClose();
      } else {
        throw new Error(res.message || 'Failed to cancel appointment');
      }
    } catch (err) {
      setError(err.message || 'Error cancelling appointment');
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
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          position: 'relative',
          background: 'rgba(18, 14, 24, 0.98)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(239, 68, 68, 0.15)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertTriangle size={20} color="#f87171" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>Cancel Appointment Slot</h3>
              <div style={{ fontSize: '0.8rem', color: '#fca5a5' }}>
                This action will release your scheduled time slot
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Appointment details summary */}
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '18px'
          }}
        >
          <div style={{ fontSize: '0.96rem', fontWeight: 600, color: '#fff' }}>
            {appointment.sessionTitle}
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.84rem', color: '#cbd5e1', marginTop: '6px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={13} color="#f87171" /> {appointment.date}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={13} color="#f87171" /> {appointment.startTime}
            </span>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: '0.86rem',
              marginBottom: '16px'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleConfirmCancel}>
          {/* Reason Input */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>
              Reason for Cancellation
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., Schedule conflict, Exam, Found alternate time"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ background: 'rgba(10, 15, 29, 0.8)', color: '#fff' }}
            />
          </div>

          {/* If genuine Calendly link exists, optionally show it */}
          {hasRealCalendlyLink && (
            <div style={{ marginBottom: '18px', fontSize: '0.8rem', color: '#94a3b8' }}>
              <span>Or cancel via Calendly: </span>
              <a
                href={appointment.cancelUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#f87171', textDecoration: 'underline' }}
              >
                Open External Link <ExternalLink size={11} style={{ display: 'inline' }} />
              </a>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
              style={{ fontSize: '0.88rem' }}
            >
              Keep Slot
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={loading}
              style={{
                fontSize: '0.88rem',
                gap: '8px',
                background: '#ef4444',
                borderColor: '#ef4444'
              }}
            >
              <XCircle size={15} />
              <span>{loading ? 'Cancelling...' : 'Yes, Cancel Slot'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
