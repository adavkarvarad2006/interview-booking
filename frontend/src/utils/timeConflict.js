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
