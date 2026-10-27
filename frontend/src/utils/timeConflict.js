/**
 * Frontend Time and Slot Conflict Utilities
 */

export function normalizeTime(timeStr) {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return trimmed;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const meridiem = match[3] ? match[3].toUpperCase() : null;

  if (meridiem) {
    if (hours > 12) hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${meridiem}`;
  } else {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  }
}

export function timeToMinutes(timeStr) {
  const norm = normalizeTime(timeStr);
  const match = norm.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const mer = match[3].toUpperCase();

  if (mer === 'PM' && h < 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;

  return h * 60 + m;
}

export function isSlotBooked(slotTimeStr, bookedList = [], duration = 15) {
  if (!bookedList || bookedList.length === 0) return false;
  const slotStart = timeToMinutes(slotTimeStr);
  const slotEnd = slotStart + Number(duration || 15);

  return bookedList.some((b) => {
    const bStart = timeToMinutes(b.startTime);
    const bEnd = bStart + Number(b.duration || 15);
    // Interval overlap: max(startA, startB) < min(endA, endB)
    return Math.max(slotStart, bStart) < Math.min(slotEnd, bEnd);
  });
}

/**
 * Compute the JavaScript Date object representing when an appointment ends
 */
export function getAppointmentEndDateTime(appt) {
  if (!appt) return null;

  // If endTime is an ISO date-time string
  if (appt.endTime && typeof appt.endTime === 'string' && appt.endTime.includes('T')) {
    const d = new Date(appt.endTime);
    if (!isNaN(d.getTime())) return d;
  }

  // If startTime is an ISO date-time string
  if (appt.startTime && typeof appt.startTime === 'string' && appt.startTime.includes('T')) {
    const d = new Date(appt.startTime);
    if (!isNaN(d.getTime())) {
      const dur = Number(appt.duration) || 15;
      return new Date(d.getTime() + dur * 60000);
    }
  }

  if (!appt.date) return null;

  const cleanDate = String(appt.date).split('T')[0].trim();
  let endMinutes;

  if (appt.endTime && appt.endTime !== appt.startTime) {
    endMinutes = timeToMinutes(appt.endTime);
  } else if (appt.startTime) {
    endMinutes = timeToMinutes(appt.startTime) + (Number(appt.duration) || 15);
  } else {
    endMinutes = 23 * 60 + 59;
  }

  const parts = cleanDate.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (parts) {
    const year = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1;
    const day = parseInt(parts[3], 10);
    const hours = Math.floor(endMinutes / 60);
    const minutes = endMinutes % 60;
    return new Date(year, month, day, hours, minutes, 0, 0);
  }

  const fallback = new Date(cleanDate);
  if (!isNaN(fallback.getTime())) {
    fallback.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
    return fallback;
  }

  return null;
}

/**
 * Returns true if the appointment's scheduled end time has passed
 */
export function hasAppointmentPassed(appt, now = new Date()) {
  const end = getAppointmentEndDateTime(appt);
  return end ? now.getTime() >= end.getTime() : false;
}

/**
 * Get the authoritative status of an appointment.
 * If a scheduled meet's scheduled time has passed, its status is displayed as 'COMPLETED'.
 */
export function getEffectiveAppointmentStatus(appt, now = new Date()) {
  if (!appt) return 'UNKNOWN';
  if (appt.status === 'CANCELLED') return 'CANCELLED';
  if (appt.status === 'COMPLETED') return 'COMPLETED';

  if (appt.status === 'SCHEDULED' || appt.status === 'RESCHEDULED') {
    if (hasAppointmentPassed(appt, now)) {
      return 'COMPLETED';
    }
    return appt.status;
  }

  return appt.status || 'SCHEDULED';
}
