const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Student = require('../models/Student');
const path = require('path');
const fs = require('fs');
const { 
  findAppointmentConflict, 
  computeEndTime, 
  autoCompletePastAppointments, 
  hasAppointmentPassed 
} = require('../utils/timeConflict');

/**
 * Helper to enrich an appointment with the student's profile context
 * (resumeUrl, resumeFileName, githubUrl, linkedinUrl, portfolioUrl, targetRoles, targetCompanies)
 */
const enrichAppointmentWithStudentContext = async (appointment) => {
  if (!appointment) return appointment;
  const apptObj = appointment.toObject ? appointment.toObject() : { ...appointment };

  let studentDoc = null;
  const studentUserId = apptObj.studentId?._id || apptObj.studentId;
  if (studentUserId) {
    studentDoc = await Student.findOne({ userId: studentUserId });
  }
  if (!studentDoc && apptObj.studentEmail) {
    const cleanEmail = apptObj.studentEmail.toLowerCase().trim();
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    if (user) {
      studentDoc = await Student.findOne({ userId: user._id });
    }
  }

  if (studentDoc) {
    if (studentDoc.resumeUrl && !apptObj.resumeUrl) {
      apptObj.resumeUrl = studentDoc.resumeUrl;
      apptObj.resumeFileName = studentDoc.resumeFileName || studentDoc.resumeUrl.split('/').pop();
      // Asynchronously backfill appointment in DB
      if (apptObj._id) {
        Appointment.findByIdAndUpdate(apptObj._id, {
          $set: {
            resumeUrl: apptObj.resumeUrl,
            resumeFileName: apptObj.resumeFileName
          }
        }).catch(err => console.warn('[Enrich Sync Warning]:', err.message));
      }
    }
    apptObj.resumeFileName = apptObj.resumeFileName || studentDoc.resumeFileName || (apptObj.resumeUrl ? apptObj.resumeUrl.split('/').pop() : '');
    apptObj.githubUrl = apptObj.githubUrl || studentDoc.githubUrl || '';
    apptObj.linkedinUrl = apptObj.linkedinUrl || studentDoc.linkedinUrl || '';
    apptObj.portfolioUrl = apptObj.portfolioUrl || studentDoc.portfolioUrl || '';
    apptObj.targetRoles = (apptObj.targetRoles && apptObj.targetRoles.length > 0) ? apptObj.targetRoles : (studentDoc.targetRoles || []);
    apptObj.targetCompanies = (apptObj.targetCompanies && apptObj.targetCompanies.length > 0) ? apptObj.targetCompanies : (studentDoc.targetCompanies || []);
    apptObj.education = apptObj.education || studentDoc.education || '';
    apptObj.experienceLevel = apptObj.experienceLevel || studentDoc.experienceLevel || '';
  }

  return apptObj;
};


const enrichAppointments = async (appointments) => {
  return Promise.all(appointments.map(enrichAppointmentWithStudentContext));
};

// @desc    Get appointments for the logged-in student
// @route   GET /api/appointments/my
// @access  Private (Student)
const getMyAppointments = async (req, res) => {
  try {
    // Automatically complete any appointments whose scheduled time has passed
    await autoCompletePastAppointments(Appointment);

    const studentEmail = req.user.email.toLowerCase();
    const studentId = req.user._id;

    const appointments = await Appointment.find({
      $or: [{ studentId: studentId }, { studentEmail: studentEmail }]
    })
      .populate('sessionId')
      .sort({ createdAt: -1 });

    const enriched = await enrichAppointments(appointments);

    res.json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all appointments (Admin)
// @route   GET /api/appointments
// @access  Private (Admin/Counsellor)
const getAllAppointments = async (req, res) => {
  try {
    // Automatically complete any appointments whose scheduled time has passed
    await autoCompletePastAppointments(Appointment);

    const { status, search, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { studentEmail: { $regex: search, $options: 'i' } },
        { sessionTitle: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const appointments = await Appointment.find(filter)
      .populate('sessionId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Appointment.countDocuments(filter);
    const enriched = await enrichAppointments(appointments);

    res.json({
      success: true,
      total,
      count: enriched.length,
      page: Number(page),
      data: enriched
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = async (req, res) => {
  try {
    let appointment = await Appointment.findById(req.params.id).populate('sessionId');
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // If meet time has passed, mark it completed
    if (
      (appointment.status === 'SCHEDULED' || appointment.status === 'RESCHEDULED') &&
      hasAppointmentPassed(appointment)
    ) {
      appointment.status = 'COMPLETED';
      await appointment.save();
    }

    // Ensure authorized user (Admin or Appointment owner)
    if (
      req.user.role === 'STUDENT' &&
      appointment.studentEmail !== req.user.email.toLowerCase() &&
      String(appointment.studentId) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this appointment' });
    }

    const enriched = await enrichAppointmentWithStudentContext(appointment);

    res.json({
      success: true,
      data: enriched
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update appointment status (e.g. mark COMPLETED)
// @route   PATCH /api/appointments/:id/status
// @access  Private (Admin/Counsellor)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['SCHEDULED', 'CANCELLED', 'COMPLETED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const updateFields = { status };
    if (notes !== undefined) updateFields.notes = notes;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // If marked completed, notify student
    if (status === 'COMPLETED' && appointment.studentId) {
      await Notification.create({
        userId: appointment.studentId,
        title: 'Counselling Session Completed',
        message: `Your session on ${appointment.date} has been marked as completed. Thank you!`,
        type: 'SYSTEM',
        appointmentId: appointment._id
      });
    }

    res.json({
      success: true,
      message: `Appointment updated to ${status}`,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel an appointment (by Student or Admin)
// @route   POST /api/appointments/:id/cancel
// @access  Private
const cancelAppointment = async (req, res) => {
  try {
    const { reason = 'Cancelled by student' } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const isOwner =
      (appointment.studentId && String(appointment.studentId) === String(req.user._id)) ||
      (appointment.studentEmail && appointment.studentEmail.toLowerCase() === req.user.email.toLowerCase());
    const isStaff = ['ADMIN', 'COUNSELLOR'].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this appointment' });
    }

    appointment.status = 'CANCELLED';
    appointment.cancellationReason = reason;
    appointment.canceledAt = new Date();
    await appointment.save();

    // Create Notification
    const notifUserId = appointment.studentId || req.user._id;
    await Notification.create({
      userId: notifUserId,
      title: 'Appointment Cancelled',
      message: `Your appointment for "${appointment.sessionTitle}" on ${appointment.date} has been cancelled. Reason: ${reason}`,
      type: 'SYSTEM',
      appointmentId: appointment._id
    });

    res.json({
      success: true,
      message: 'Appointment successfully cancelled',
      data: appointment
    });
  } catch (error) {
    console.error('[Cancel Appointment Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reschedule an appointment (by Student or Admin)
// @route   POST /api/appointments/:id/reschedule
// @access  Private
const rescheduleAppointment = async (req, res) => {
  try {
    const { newDate, newTime, reason } = req.body;

    if (!newDate || !newTime) {
      return res.status(400).json({ success: false, message: 'Please provide both newDate and newTime' });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const isOwner =
      (appointment.studentId && String(appointment.studentId) === String(req.user._id)) ||
      (appointment.studentEmail && appointment.studentEmail.toLowerCase() === req.user.email.toLowerCase());
    const isStaff = ['ADMIN', 'COUNSELLOR'].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: 'Not authorized to reschedule this appointment' });
    }

    const previousDate = appointment.date;
    const previousTime = appointment.startTime;
    const duration = appointment.duration || 15;

    // Check for conflict with other SCHEDULED appointments on the new date & time
    const conflict = await findAppointmentConflict(Appointment, {
      date: newDate,
      startTime: newTime,
      duration,
      excludeId: appointment._id
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `The slot on ${newDate} at ${newTime} is already booked. The counsellor can only take one session at a time. Please select an available slot.`
      });
    }

    appointment.date = newDate;
    appointment.startTime = newTime;
    appointment.endTime = computeEndTime(newDate, newTime, duration);
    appointment.status = 'SCHEDULED';
    appointment.cancellationReason = '';
    appointment.canceledAt = null;

    if (reason) {
      appointment.notes = appointment.notes ? `${appointment.notes} | Rescheduled: ${reason}` : `Rescheduled: ${reason}`;
    }

    // Refresh Google Calendar link with new date/time
    const meetLink = appointment.googleMeetLink || 'https://meet.google.com/interview-session';
    appointment.googleCalendarEventUrl = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(
      appointment.sessionTitle
    )}&details=${encodeURIComponent(
      `Interview Counselling Session with ${appointment.studentName}.\n🎥 Video Meeting Link: ${meetLink}\nDuration: ${duration} Minutes`
    )}&location=${encodeURIComponent(meetLink)}`;

    await appointment.save();

    // Create Notification
    const notifUserId = appointment.studentId || req.user._id;
    await Notification.create({
      userId: notifUserId,
      title: 'Appointment Rescheduled',
      message: `Your appointment for "${appointment.sessionTitle}" has been rescheduled from ${previousDate} (${previousTime}) to ${newDate} at ${newTime}.`,
      type: 'SYSTEM',
      appointmentId: appointment._id
    });

    res.json({
      success: true,
      message: 'Appointment successfully rescheduled',
      data: appointment
    });
  } catch (error) {
    console.error('[Reschedule Appointment Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update appointment pre-session context (resume, GitHub, LinkedIn, portfolio)
// @route   PATCH /api/appointments/:id/context
// @access  Private (Student or Counsellor/Admin)
const updateAppointmentContext = async (req, res) => {
  try {
    const { resumeUrl, resumeFileName, githubUrl, linkedinUrl, portfolioUrl, notes } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const isOwner =
      (appointment.studentId && String(appointment.studentId) === String(req.user._id)) ||
      (appointment.studentEmail && appointment.studentEmail.toLowerCase() === req.user.email.toLowerCase());
    const isStaff = ['ADMIN', 'COUNSELLOR'].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this appointment context' });
    }

    if (resumeUrl !== undefined) appointment.resumeUrl = resumeUrl;
    if (resumeFileName !== undefined) appointment.resumeFileName = resumeFileName;
    if (githubUrl !== undefined) appointment.githubUrl = githubUrl;
    if (linkedinUrl !== undefined) appointment.linkedinUrl = linkedinUrl;
    if (portfolioUrl !== undefined) appointment.portfolioUrl = portfolioUrl;
    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();

    // Also update Student profile if student is updating
    if (req.user.role === 'STUDENT') {
      const studentUpdates = {};
      if (resumeUrl !== undefined) studentUpdates.resumeUrl = resumeUrl;
      if (resumeFileName !== undefined) studentUpdates.resumeFileName = resumeFileName;
      if (githubUrl !== undefined) studentUpdates.githubUrl = githubUrl;
      if (linkedinUrl !== undefined) studentUpdates.linkedinUrl = linkedinUrl;
      if (portfolioUrl !== undefined) studentUpdates.portfolioUrl = portfolioUrl;

      if (Object.keys(studentUpdates).length > 0) {
        await Student.findOneAndUpdate(
          { userId: req.user._id },
          { $set: studentUpdates },
          { upsert: true }
        );
      }
    }

    const enriched = await enrichAppointmentWithStudentContext(appointment);

    res.json({
      success: true,
      message: 'Pre-session context updated successfully',
      data: enriched
    });
  } catch (error) {
    console.error('[Update Appointment Context Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download / view resume for an appointment
// @route   GET /api/appointments/:id/resume
// @access  Public / Authorized
const getAppointmentResume = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    let resumeUrl = appointment.resumeUrl;
    let resumeFileName = appointment.resumeFileName;

    // Fallback: check Student document if not attached to appointment directly
    if (!resumeUrl) {
      let student = null;
      if (appointment.studentId) {
        student = await Student.findOne({ userId: appointment.studentId });
      }
      if (!student && appointment.studentEmail) {
        const user = await User.findOne({ email: appointment.studentEmail.toLowerCase() });
        if (user) student = await Student.findOne({ userId: user._id });
      }
      if (student && student.resumeUrl) {
        resumeUrl = student.resumeUrl;
        resumeFileName = student.resumeFileName || resumeFileName;
      }
    }

    if (!resumeUrl) {
      return res.status(404).json({ success: false, message: 'No resume uploaded for this appointment' });
    }

    // If external link (e.g. Google Drive, Cloudinary, etc.)
    if (resumeUrl.startsWith('http://') || resumeUrl.startsWith('https://')) {
      return res.redirect(resumeUrl);
    }

    // Local file path
    const filename = path.basename(resumeUrl);
    const uploadsDir = path.join(__dirname, '../../uploads/resumes');
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      const { ensureResumeFileExists } = require('../utils/pdfGenerator');
      ensureResumeFileExists(filePath, {
        name: appointment.studentName,
        email: appointment.studentEmail,
        resumeFileName: resumeFileName || filename,
        targetRoles: appointment.targetRoles,
        targetCompanies: appointment.targetCompanies,
        githubUrl: appointment.githubUrl,
        linkedinUrl: appointment.linkedinUrl,
        portfolioUrl: appointment.portfolioUrl
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${resumeFileName || filename}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    return res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('[Get Appointment Resume Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyAppointments,
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  rescheduleAppointment,
  updateAppointmentContext,
  getAppointmentResume
};

