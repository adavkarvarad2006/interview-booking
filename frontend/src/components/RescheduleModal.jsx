import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Calendar, Clock, RefreshCw, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';
import { isSlotBooked } from '../utils/timeConflict';

const POPULAR_SLOTS = [
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM'
];

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

export default function RescheduleModal({ isOpen, onClose, appointment, onSuccess }) {
  const [newDate, setNewDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Initialize with tomorrow's date or next working day
  useEffect(() => {
    if (isOpen && appointment) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      setNewDate(`${yyyy}-${mm}-${dd}`);
      setSelectedSlot('');
      setReason('');
      setError(null);
    }
  }, [isOpen, appointment]);

  // Fetch booked slots whenever newDate changes
  useEffect(() => {
    let isMounted = true;
    const fetchSlots = async () => {
      if (!newDate) return;
      setLoadingSlots(true);
      try {
        const res = await api.getBookedSlots(newDate);
        if (isMounted && res.success) {
          // Exclude current appointment being rescheduled
          const relevant = (res.bookedSlots || []).filter(
            (b) => String(b._id) !== String(appointment?._id)
          );
          setBookedSlots(relevant);
        }
      } catch (err) {
        console.warn('Could not fetch booked slots for reschedule:', err);
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    };
    if (isOpen && newDate) {
      fetchSlots();
    }
    return () => {
      isMounted = false;
    };
  }, [newDate, isOpen, appointment]);

  // Auto-select first available slot if current is booked or none selected
  useEffect(() => {
    if (POPULAR_SLOTS.length > 0 && newDate) {
      const isCurrentBooked = selectedSlot && isSlotBooked(selectedSlot, bookedSlots, appointment?.duration || 15);
      if (!selectedSlot || isCurrentBooked) {
        const firstAvail = POPULAR_SLOTS.find(
          (s) => !isSlotBooked(s, bookedSlots, appointment?.duration || 15)
        );
        setSelectedSlot(firstAvail || '');
      }
    }
  }, [bookedSlots, newDate, appointment]);

  if (!isOpen || !appointment) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const hasRealCalendlyLink = isGenuineCalendlyUrl(appointment.rescheduleUrl);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDate || !selectedSlot) {
      setError('Please choose both a new date and a time slot.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.rescheduleAppointment(appointment._id, {
        newDate,
        newTime: selectedSlot,
        reason: reason.trim() || 'Rescheduled via student dashboard'
      });

      if (res.success) {
        try {
          confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
        } catch (e) {
          // ignore confetti error
        }
        if (onSuccess) {
          onSuccess(res.data);
        }
        onClose();
      } else {
        throw new Error(res.message || 'Failed to reschedule appointment');
      }
    } catch (err) {
      setError(err.message || 'Error rescheduling appointment');
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
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          border: '1px solid var(--border-highlight)',
          position: 'relative',
          background: 'rgba(15, 21, 35, 0.98)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RefreshCw size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>Reschedule Session Slot</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Select a new convenient date and time
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Current appointment info card */}
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '20px'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Current Appointment
          </div>
          <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.98rem' }}>
            {appointment.sessionTitle}
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.84rem', color: '#94a3b8', marginTop: '6px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={13} color="#818cf8" /> {appointment.date}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={13} color="#818cf8" /> {appointment.startTime}
            </span>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* New Date */}
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>
              Choose New Date
            </label>
            <input
              type="date"
              className="form-control"
              min={todayStr}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
              style={{ background: 'rgba(10, 15, 29, 0.8)', color: '#fff' }}
            />
          </div>

          {/* New Time Slots */}
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Select New Time Slot</span>
              <span style={{ color: '#818cf8', fontWeight: 600 }}>
                {loadingSlots ? 'Checking slots...' : selectedSlot || 'None selected'}
              </span>
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                marginTop: '6px'
              }}
            >
              {POPULAR_SLOTS.map((slot) => {
                const booked = isSlotBooked(slot, bookedSlots, appointment?.duration || 15);
                const isSelected = selectedSlot === slot;

                if (booked) {
                  return (
                    <div
                      key={slot}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        border: '1px dashed rgba(239, 68, 68, 0.3)',
                        background: 'rgba(239, 68, 68, 0.05)',
                        color: '#64748b',
                        opacity: 0.6,
                        cursor: 'not-allowed',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px'
                      }}
                      title="This slot is already booked for this counsellor."
                    >
                      <span style={{ textDecoration: 'line-through' }}>{slot}</span>
                      <span style={{ fontSize: '0.65rem', color: '#f87171', fontWeight: 600 }}>Booked</span>
                    </div>
                  );
                }

                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      setSelectedSlot(slot);
                      setError(null);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(6, 182, 212, 0.3) 100%)'
                        : 'rgba(255, 255, 255, 0.03)',
                      color: isSelected ? '#fff' : '#cbd5e1',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>

            {POPULAR_SLOTS.every((s) => isSlotBooked(s, bookedSlots, appointment?.duration || 15)) && !loadingSlots && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <AlertCircle size={14} />
                <span>All time slots on this date are already booked. Please choose another date above.</span>
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="form-group" style={{ marginBottom: '22px' }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>
              Reason for Rescheduling (Optional)
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., Schedule conflict with college classes"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ background: 'rgba(10, 15, 29, 0.8)', color: '#fff' }}
            />
          </div>

          {/* If genuine Calendly link exists, optionally show it */}
          {hasRealCalendlyLink && (
            <div style={{ marginBottom: '20px', fontSize: '0.8rem', color: '#94a3b8' }}>
              <span>Or reschedule on Calendly directly: </span>
              <a
                href={appointment.rescheduleUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#38bdf8', textDecoration: 'underline' }}
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
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !newDate || !selectedSlot}
              style={{
                fontSize: '0.88rem',
                gap: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
              }}
            >
              {loading ? <RefreshCw size={14} className="spin" /> : <CheckCircle2 size={15} />}
              <span>{loading ? 'Rescheduling...' : 'Confirm Reschedule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
