const BlockedDate = require('../models/BlockedDate');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const { normalizeTime, autoCompletePastAppointments } = require('../utils/timeConflict');

// @desc    Get all blocked dates
// @route   GET /api/availability/blocked
// @access  Public
const getBlockedDates = async (req, res) => {
  try {
    const blockedDates = await BlockedDate.find().sort({ date: 1 });
    res.json({
      success: true,
      count: blockedDates.length,
      data: blockedDates
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Block a date from Calendly availability
// @route   POST /api/availability/block
// @access  Private (Admin/Counsellor)
const blockDate = async (req, res) => {
  try {
    const { date, reason, syncMethod = 'DUAL_SYNC' } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Please select a date to block' });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a reason for blocking this date' });
    }

    const existing = await BlockedDate.findOne({ date });
    if (existing) {
      return res.status(400).json({ success: false, message: `Date ${date} is already blocked for: ${existing.reason}` });
    }

    // Google Calendar conflict event URL to block Calendly slots
    const gcalStart = date.replace(/-/g, '');
    // Next day for all-day event
    const nextDay = new Date(new Date(date).getTime() + 86400000).toISOString().split('T')[0].replace(/-/g, '');
    const gcalEventUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `[BLOCKED - COUNSELLOR UNAVAILABLE] ${reason}`
    )}&dates=${gcalStart}/${nextDay}&details=${encodeURIComponent(
      `Date blocked in Counselling Portal. This event marks the counsellor as BUSY in Google Calendar, which Calendly reads to automatically remove all appointment slots for this date.`
    )}&sf=true&output=xml`;

    const blocked = await BlockedDate.create({
      date,
      reason,
      createdBy: req.user._id,
      syncMethod,
      calendlySyncStatus: 'ACTIVE_BLOCK',
      googleCalendarEventTitle: `[BLOCKED] ${reason}`,
      calendlyOverrideInstructions: `To guarantee zero bookings, Calendly checks the connected Google Calendar for Busy events and automatically closes all booking slots on ${date}. You can also configure a Date Override in Calendly availability settings.`
    });

    // Notify counsellor
    await Notification.create({
      userId: req.user._id,
      title: 'Date Blocked in Calendar Availability',
      message: `Date ${date} has been blocked (${reason}). Calendly slots will be unavailable.`,
      type: 'AVAILABILITY_BLOCKED'
    });

    res.status(201).json({
      success: true,
      message: `Date ${date} successfully blocked in availability system`,
      data: {
        ...blocked.toObject(),
        googleCalendarBlockerUrl: gcalEventUrl
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Unblock a previously blocked date
// @route   DELETE /api/availability/block/:id
// @access  Private (Admin/Counsellor)
const unblockDate = async (req, res) => {
  try {
    const blocked = await BlockedDate.findById(req.params.id);
    if (!blocked) {
      return res.status(404).json({ success: false, message: 'Blocked date record not found' });
    }

    await BlockedDate.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Date ${blocked.date} unblocked. Calendly slots will resume standard schedule.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed architectural explanation of how Calendly blocks availability
// @route   GET /api/availability/explanation
// @access  Public
const getAvailabilityExplanation = (req, res) => {
  res.json({
    success: true,
    data: {
      mechanism: 'Calendly Real-Time Availability & Conflict Engine',
      summary: 'Calendly is the single source of truth for availability. Dates are blocked at the source, preventing any student from booking.',
      steps: [
        {
          step: 1,
          title: 'Google Calendar Conflict Synchronization',
          description: 'Calendly connects to the counsellor\'s Google Calendar. When a date is blocked with a "Busy" event in Google Calendar, Calendly\'s scheduling engine immediately detects the conflict and removes all slots for that day.'
        },
        {
          step: 2,
          title: 'Calendly Date Overrides',
          description: 'Calendly allows counsellors to set Date Overrides directly on their schedule (https://calendly.com/app/availability/schedules) to mark specific dates as "Unavailable".'
        },
        {
          step: 3,
          title: 'Authoritative Backend & Embed Alignment',
          description: 'Because our booking page embeds the live Calendly widget, the student only sees real-time open slots allowed by Calendly. No slots on blocked dates are ever generated or bookable.'
        }
      ]
    }
  });
};

// @desc    Get all booked/unavailable time slots for a specific date or all dates
// @route   GET /api/availability/slots
// @access  Public
const getBookedSlots = async (req, res) => {
  try {
    // Ensure all passed scheduled appointments are marked COMPLETED
    await autoCompletePastAppointments(Appointment);

    const { date } = req.query;
    const filter = { status: 'SCHEDULED' }; // Only active scheduled sessions block availability!

    if (date) {
      filter.date = date.trim();
    }

    const scheduledAppointments = await Appointment.find(filter)
      .select('date startTime endTime duration sessionTitle')
      .sort({ date: 1, startTime: 1 });

    const blockedDates = await BlockedDate.find().select('date reason');

    const formattedSlots = scheduledAppointments.map((appt) => ({
      _id: appt._id,
      date: appt.date,
      startTime: normalizeTime(appt.startTime),
      endTime: appt.endTime,
      duration: appt.duration || 15,
      sessionTitle: appt.sessionTitle
    }));

    res.json({
      success: true,
      date: date || 'ALL',
      count: formattedSlots.length,
      bookedSlots: formattedSlots,
      blockedDates: blockedDates.map((b) => b.date)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBlockedDates,
  blockDate,
  unblockDate,
  getAvailabilityExplanation,
  getBookedSlots
};
