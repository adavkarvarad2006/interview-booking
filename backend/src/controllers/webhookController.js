const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Student = require('../models/Student');
const InterviewSession = require('../models/InterviewSession');
const Notification = require('../models/Notification');
const CalendlyIntegration = require('../models/CalendlyIntegration');
const { 
  findAppointmentConflict, 
  normalizeTime, 
  timeToMinutes, 
  computeEndTime 
} = require('../utils/timeConflict');

/**
 * Helper to parse ISO date/time into readable string formats in India Standard Time
 */
const formatDateTime = (isoString, timeZone = 'Asia/Kolkata') => {
  if (!isoString) return { date: '', time: '' };
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return { date: String(isoString).split('T')[0], time: '' };
    }
    const date = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d);
    const time = d.toLocaleTimeString('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return { date, time };
  } catch (err) {
    return { date: String(isoString).split('T')[0], time: '' };
  }
};

/**
 * Generate standard Google Meet URL: https://meet.google.com/xxx-yyyy-zzz
 */
const generateGoogleMeetLink = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const r = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `https://meet.google.com/${r(3)}-${r(4)}-${r(3)}`;
};

/**
 * @desc Process Calendly Webhook Event
 * @route POST /api/calendly/webhook
 * @access Public (verified via signature)
 */
const handleCalendlyWebhook = async (req, res) => {
  try {
    const { event, payload } = req.body;

    if (!event || !payload) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook payload structure. Expected event and payload fields.'
      });
    }

    console.log(`[Calendly Webhook Received] Event: ${event} at ${new Date().toISOString()}`);

    // Update integration health record
    await CalendlyIntegration.findOneAndUpdate(
      { isActive: true },
      {
        lastWebhookReceivedAt: new Date(),
        lastWebhookEvent: event
      },
      { upsert: true }
    );

    // 1. Handle Invitee Created
    if (event === 'invitee.created') {
      const inviteeUri = payload.uri || payload.invitee_uri || `calendly_inv_${Date.now()}`;
      const eventUri = payload.event || (payload.scheduled_event && payload.scheduled_event.uri) || `calendly_evt_${Date.now()}`;
      const studentName = payload.name || 'Student';
      const studentEmail = (payload.email || '').toLowerCase().trim();
      
      const scheduledEvent = payload.scheduled_event || {};
      const startTimeIso = scheduledEvent.start_time || payload.start_time || new Date().toISOString();
      const endTimeIso = scheduledEvent.end_time || payload.end_time || new Date(Date.now() + 15 * 60000).toISOString();
      
      // Calculate duration in minutes
      const startMs = new Date(startTimeIso).getTime();
      const endMs = new Date(endTimeIso).getTime();
      let duration = 15;
      if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
        duration = Math.round((endMs - startMs) / 60000);
      }

      const { date: parsedDate, time: startTimeFormatted } = formatDateTime(startTimeIso);
      const { time: endTimeFormatted } = formatDateTime(endTimeIso);

      const date = payload.date || parsedDate;
      const startTime = payload.startTime || startTimeFormatted || startTimeIso;
      const endTime = payload.endTime || endTimeFormatted || endTimeIso;

      // Extract notes / Q&A
      let notes = '';
      if (Array.isArray(payload.questions_and_answers)) {
        notes = payload.questions_and_answers
          .map((qa) => `${qa.question}: ${qa.answer}`)
          .join(' | ');
      } else if (payload.notes) {
        notes = payload.notes;
      }

      const rescheduleUrl = payload.reschedule_url || '';
      const cancelUrl = payload.cancel_url || '';
      const eventName = scheduledEvent.name || (duration >= 30 ? 'Mock Interview & Training' : 'Quick Interview Counselling');

      // Match or infer InterviewSession
      let sessionType = duration >= 30 ? 'MOCK_INTERVIEW' : 'COUNSELLING';
      let matchedSession = await InterviewSession.findOne({
        $or: [
          { duration: duration },
          { title: new RegExp(eventName, 'i') },
          { sessionType: sessionType }
        ]
      });

      // Find or create student user
      let studentUser = null;
      if (studentEmail) {
        studentUser = await User.findOne({ email: studentEmail });
        if (!studentUser) {
          // Auto-create student user account so they can log in or view appointment history
          studentUser = await User.create({
            name: studentName,
            email: studentEmail,
            password: 'StudentTempPassword@2026', // Can reset or login
            role: 'STUDENT'
          });
          await Student.create({
            userId: studentUser._id,
            targetRoles: ['Software Engineer'],
            preparationNotes: notes
          });
          console.log(`[Webhook] Auto-created student profile for ${studentEmail}`);
        }
      }

      // Find counsellor user to notify
      const counsellorUser = await User.findOne({ role: { $in: ['COUNSELLOR', 'ADMIN'] } });

      // Retrieve or generate Google Meet video room link
      let googleMeetLink = payload.join_url || 
        (payload.scheduled_event && payload.scheduled_event.location) ||
        '';
      if (!googleMeetLink || !googleMeetLink.includes('meet.google.com')) {
        googleMeetLink = generateGoogleMeetLink();
      }

      const googleCalUrl = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(eventName)}&details=${encodeURIComponent(`Interview Counselling Session with Dr. Parkavi A.\nJoin Google Meet: ${googleMeetLink}\n\nNotes: ${notes || 'None'}`)}&location=${encodeURIComponent(googleMeetLink)}`;

      // Check for overlapping SCHEDULED appointment
      const existingSameInvitee = await Appointment.findOne({ calendlyInviteeId: inviteeUri });
      const conflict = await findAppointmentConflict(Appointment, {
        date,
        startTime,
        duration,
        excludeId: existingSameInvitee?._id
      });

      if (conflict) {
        console.warn(`[Webhook Conflict Blocked] Slot on ${date} at ${startTime} already booked.`);
        return res.status(409).json({
          success: false,
          message: `Slot conflict: Counsellor is already booked on ${date} at ${conflict.startTime}`
        });
      }

      // Retrieve existing student profile details if available
      let existingStudentProfile = null;
      if (studentUser) {
        existingStudentProfile = await Student.findOne({ userId: studentUser._id });
      }

      // Upsert appointment record (idempotency by calendlyInviteeId)
      const appointment = await Appointment.findOneAndUpdate(
        { calendlyInviteeId: inviteeUri },
        {
          studentId: studentUser ? studentUser._id : null,
          sessionId: matchedSession ? matchedSession._id : null,
          calendlyEventId: eventUri,
          calendlyInviteeId: inviteeUri,
          date,
          startTime,
          endTime,
          duration,
          status: 'SCHEDULED',
          studentName,
          studentEmail,
          notes,
          resumeUrl: payload.resumeUrl || existingStudentProfile?.resumeUrl || '',
          resumeFileName: payload.resumeFileName || existingStudentProfile?.resumeFileName || '',
          githubUrl: payload.githubUrl || existingStudentProfile?.githubUrl || '',
          linkedinUrl: payload.linkedinUrl || existingStudentProfile?.linkedinUrl || '',
          portfolioUrl: payload.portfolioUrl || existingStudentProfile?.portfolioUrl || '',
          sessionTitle: matchedSession ? matchedSession.title : eventName,
          sessionType: matchedSession ? matchedSession.sessionType : sessionType,
          rescheduleUrl,
          cancelUrl,
          googleMeetLink,
          googleCalendarEventUrl: googleCalUrl,
          rawCalendlyPayload: payload
        },
        { upsert: true, new: true }
      );

      if (studentUser && (payload.resumeUrl || payload.githubUrl || payload.linkedinUrl)) {
        const studentUpdates = {};
        if (payload.resumeUrl) {
          studentUpdates.resumeUrl = payload.resumeUrl;
          studentUpdates.resumeFileName = payload.resumeFileName || payload.resumeUrl.split('/').pop();
        }
        if (payload.githubUrl) studentUpdates.githubUrl = payload.githubUrl;
        if (payload.linkedinUrl) studentUpdates.linkedinUrl = payload.linkedinUrl;
        await Student.findOneAndUpdate(
          { userId: studentUser._id },
          { $set: studentUpdates },
          { upsert: true }
        );
      }

      console.log(`[Webhook] Appointment created/updated: ${appointment._id} for ${studentEmail} with Meet Link: ${googleMeetLink}`);


      // Create in-app notification for student
      if (studentUser) {
        await Notification.create({
          userId: studentUser._id,
          title: 'Interview Counselling Scheduled!',
          message: `Your ${appointment.duration}-minute session "${appointment.sessionTitle}" is confirmed for ${appointment.date} at ${appointment.startTime}. Google Meet Link: ${appointment.googleMeetLink}`,
          type: 'BOOKING_CREATED',
          appointmentId: appointment._id
        });
      }

      // Create in-app notification for counsellor
      if (counsellorUser) {
        await Notification.create({
          userId: counsellorUser._id,
          title: 'New Student Booking with Google Meet',
          message: `${studentName} (${studentEmail}) booked a ${appointment.duration}-min "${appointment.sessionTitle}" on ${appointment.date} at ${appointment.startTime}. Google Meet: ${appointment.googleMeetLink}`,
          type: 'BOOKING_CREATED',
          appointmentId: appointment._id
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Calendly booking processed successfully',
        appointmentId: appointment._id,
        googleMeetLink: appointment.googleMeetLink,
        data: appointment
      });
    }

    // 2. Handle Invitee Canceled
    if (event === 'invitee.canceled') {
      const inviteeUri = payload.uri || payload.invitee_uri;
      const cancellationReason = (payload.cancellation && payload.cancellation.reason) || 'Cancelled via Calendly';
      
      const appointment = await Appointment.findOneAndUpdate(
        { $or: [{ calendlyInviteeId: inviteeUri }, { calendlyEventId: payload.event }] },
        {
          status: 'CANCELLED',
          cancellationReason,
          canceledAt: new Date(),
          rawCalendlyPayload: payload
        },
        { new: true }
      );

      if (appointment) {
        console.log(`[Webhook] Appointment ${appointment._id} marked CANCELLED`);

        // Notify student and counsellor
        if (appointment.studentId) {
          await Notification.create({
            userId: appointment.studentId,
            title: 'Interview Counselling Cancelled',
            message: `Your appointment on ${appointment.date} was cancelled: ${cancellationReason}`,
            type: 'BOOKING_CANCELLED',
            appointmentId: appointment._id
          });
        }

        const counsellorUser = await User.findOne({ role: { $in: ['COUNSELLOR', 'ADMIN'] } });
        if (counsellorUser) {
          await Notification.create({
            userId: counsellorUser._id,
            title: 'Session Cancelled via Calendly',
            message: `${appointment.studentName} cancelled their session on ${appointment.date}. Reason: ${cancellationReason}`,
            type: 'BOOKING_CANCELLED',
            appointmentId: appointment._id
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Cancellation processed successfully',
          appointmentId: appointment._id
        });
      } else {
        console.warn(`[Webhook Warning] No appointment found for canceled inviteeUri: ${inviteeUri}`);
        return res.status(200).json({
          success: true,
          message: 'Webhook processed; appointment not found in local db'
        });
      }
    }

    // Other unhandled events
    return res.status(200).json({
      success: true,
      message: `Unhandled event type: ${event}`
    });
  } catch (error) {
    console.error('[Calendly Webhook Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Simulation helper to test Calendly Webhooks locally without ngrok
 * @route POST /api/calendly/webhook/simulate
 * @access Private (Admin) or Dev
 */
const simulateWebhook = async (req, res) => {
  try {
    const {
      eventType = 'invitee.created',
      studentName = 'Alex Mercer',
      studentEmail = 'alex.mercer@gmail.com',
      duration = 15,
      date = '2026-10-15',
      time = '14:30',
      reason = 'Personal rescheduling',
      resumeUrl = '',
      resumeFileName = '',
      githubUrl = '',
      linkedinUrl = '',
      portfolioUrl = ''
    } = req.body;

    const mockEventId = `sim_evt_${Date.now()}`;
    const mockInviteeId = `sim_inv_${Date.now()}`;

    let payload = {};

    if (eventType === 'invitee.created') {
      const durationNum = Number(duration) || 15;
      const cleanDate = (date ? String(date).split('T')[0] : new Date().toISOString().split('T')[0]).trim();
      const normalizedTime = normalizeTime(time) || time;

      // Check for slot conflict with any existing SCHEDULED appointment
      const conflict = await findAppointmentConflict(Appointment, {
        date: cleanDate,
        startTime: normalizedTime,
        duration: durationNum
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: `The counsellor already has a scheduled session on ${cleanDate} at ${conflict.startTime} (${conflict.sessionTitle}). The counsellor can only take one session at a time. Please select an available slot.`
        });
      }

      // Convert time to hours and minutes from midnight
      const startMins = timeToMinutes(normalizedTime);
      const startH = String(Math.floor(startMins / 60)).padStart(2, '0');
      const startM = String(startMins % 60).padStart(2, '0');

      // Create valid ISO timestamp in IST (+05:30)
      const startDate = new Date(`${cleanDate}T${startH}:${startM}:00+05:30`);
      const startTime = !isNaN(startDate.getTime())
        ? startDate.toISOString()
        : new Date().toISOString();
      const endTime = !isNaN(startDate.getTime())
        ? new Date(startDate.getTime() + durationNum * 60000).toISOString()
        : new Date(Date.now() + durationNum * 60000).toISOString();

      const computedEnd = computeEndTime(cleanDate, normalizedTime, durationNum);
      const sessionTitle = durationNum === 30 ? 'Mock Interview & Training' : 'Quick Interview Counselling';

      payload = {
        event: `https://api.calendly.com/scheduled_events/${mockEventId}`,
        uri: `https://api.calendly.com/scheduled_events/${mockEventId}/invitees/${mockInviteeId}`,
        name: studentName,
        email: studentEmail,
        status: 'active',
        date: cleanDate,
        startTime: normalizedTime,
        endTime: computedEnd,
        reschedule_url: '',
        cancel_url: '',
        resumeUrl,
        resumeFileName,
        githubUrl,
        linkedinUrl,
        portfolioUrl,
        scheduled_event: {
          uri: `https://api.calendly.com/scheduled_events/${mockEventId}`,
          name: sessionTitle,
          start_time: startTime,
          end_time: endTime,
          event_type: `https://api.calendly.com/event_types/type_${durationNum}m`
        },
        questions_and_answers: [
          {
            question: 'What are your target companies & interview goals?',
            answer: 'Preparing for Google and Meta technical interviews. Need feedback on system design and coding communication.'
          }
        ]
      };
    } else {
      // Cancellation simulation
      const existing = await Appointment.findOne({ status: 'SCHEDULED' }).sort({ createdAt: -1 });
      const targetInvitee = existing ? existing.calendlyInviteeId : mockInviteeId;
      const targetEvent = existing ? existing.calendlyEventId : mockEventId;

      payload = {
        event: targetEvent,
        uri: targetInvitee,
        name: existing ? existing.studentName : studentName,
        email: existing ? existing.studentEmail : studentEmail,
        status: 'canceled',
        cancellation: {
          canceled_by: studentName,
          reason: reason || 'Student conflict'
        }
      };
    }

    // Call internal webhook handler logic
    req.body = {
      event: eventType,
      time: new Date().toISOString(),
      payload
    };

    return handleCalendlyWebhook(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  handleCalendlyWebhook,
  simulateWebhook
};
