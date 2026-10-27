/**
 * Time and Scheduling Conflict Resolution Utilities
 * Guarantees that only ONE session can be scheduled for a counsellor at any given time.
 */

/**
 * Standardize time strings to "HH:MM AM/PM" (12-hour format)
 * Examples: "10:30" -> "10:30 AM", "14:30" -> "02:30 PM", "9:30 AM" -> "09:30 AM"
 */
function normalizeTime(timeStr) {
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

/**
 * Convert time string to minutes from 00:00 midnight (0 to 1439)
 */
function timeToMinutes(timeStr) {
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

/**
 * Compute end time string based on start time and duration in minutes
 */
function computeEndTime(dateStr, startTimeStr, durationMinutes = 15) {
  try {
    const startMins = timeToMinutes(startTimeStr);
    const endMins = startMins + Number(durationMinutes || 15);

    let h = Math.floor(endMins / 60) % 24;
    const m = endMins % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  } catch (e) {
    return startTimeStr;
  }
}

/**
 * Check if two time slots overlap
 * Range A: [startA, startA + durA)
 * Range B: [startB, startB + durB)
 */
function slotsConflict(startAStr, durA = 15, startBStr, durB = 15) {
  const startA = timeToMinutes(startAStr);
  const endA = startA + Number(durA || 15);

  const startB = timeToMinutes(startBStr);
  const endB = startB + Number(durB || 15);

  // Two intervals [A1, A2) and [B1, B2) overlap if: max(A1, B1) < min(A2, B2)
  return Math.max(startA, startB) < Math.min(endA, endB);
}

/**
 * Find if any currently SCHEDULED appointment on `date` overlaps with the proposed time
 */
async function findAppointmentConflict(AppointmentModel, { date, startTime, duration = 15, excludeId = null }) {
  if (!date || !startTime) return null;

  // Auto-complete any appointments that have already passed so they don't block future slots
  await autoCompletePastAppointments(AppointmentModel);

  const query = {
    date: date.trim(),
    status: 'SCHEDULED' // Only currently active scheduled appointments block the counsellor
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existingScheduled = await AppointmentModel.find(query);

  const proposedStart = normalizeTime(startTime);
  const proposedDur = Number(duration || 15);

  for (const appt of existingScheduled) {
    const apptStart = normalizeTime(appt.startTime);
    const apptDur = Number(appt.duration || 15);

    if (slotsConflict(proposedStart, proposedDur, apptStart, apptDur)) {
      return appt; // Conflict found!
    }
  }

  return null;
}

/**
 * Compute the JavaScript Date object representing when an appointment ends
 */
function getAppointmentEndDateTime(appt) {
  if (!appt) return null;

  // If endTime is already an ISO date-time string
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
 * Returns true if the appointment's scheduled end time is in the past
 */
function hasAppointmentPassed(appt, now = new Date()) {
  const end = getAppointmentEndDateTime(appt);
  return end ? now.getTime() >= end.getTime() : false;
}

/**
 * Automatically find any SCHEDULED appointment whose scheduled time has passed
 * and transition its status to COMPLETED in the database.
 */
async function autoCompletePastAppointments(AppointmentModel) {
  try {
    const Model = AppointmentModel || require('../models/Appointment');
    const scheduledAppointments = await Model.find({
      status: { $in: ['SCHEDULED', 'RESCHEDULED'] }
    });

    const now = new Date();
    const passedIds = [];

    for (const appt of scheduledAppointments) {
      if (hasAppointmentPassed(appt, now)) {
        passedIds.push(appt._id);
      }
    }

    if (passedIds.length > 0) {
      await Model.updateMany(
        { _id: { $in: passedIds } },
        { $set: { status: 'COMPLETED' } }
      );
      console.log(`[Auto-Complete] Automatically marked ${passedIds.length} passed appointment(s) as COMPLETED.`);
    }

    return passedIds.length;
  } catch (err) {
    console.error('[Auto-Complete Appointments Error]:', err.message);
    return 0;
  }
}

/**
 * Get the authoritative status of an appointment.
 * If a scheduled meet's scheduled time has passed, its status is displayed as 'COMPLETED'.
 */
function getEffectiveAppointmentStatus(appt, now = new Date()) {
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

module.exports = {
  normalizeTime,
  timeToMinutes,
  computeEndTime,
  slotsConflict,
  findAppointmentConflict,
  getAppointmentEndDateTime,
  hasAppointmentPassed,
  autoCompletePastAppointments,
  getEffectiveAppointmentStatus
};
