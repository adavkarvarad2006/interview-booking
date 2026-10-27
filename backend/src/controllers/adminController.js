const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Student = require('../models/Student');
const BlockedDate = require('../models/BlockedDate');
const InterviewSession = require('../models/InterviewSession');
const CalendlyIntegration = require('../models/CalendlyIntegration');
const Notification = require('../models/Notification');
const { 
  autoCompletePastAppointments, 
  hasAppointmentPassed 
} = require('../utils/timeConflict');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/dashboard-stats
// @access  Private (Admin/Counsellor)
const getDashboardStats = async (req, res) => {
  try {
    // Ensure all passed scheduled appointments are marked COMPLETED
    await autoCompletePastAppointments(Appointment);

    const todayStr = new Date().toISOString().split('T')[0];

    // Today's appointments count
    const todayCount = await Appointment.countDocuments({
      date: todayStr,
      status: { $ne: 'CANCELLED' }
    });

    // Upcoming appointments count (scheduled appointments whose scheduled time has not passed)
    const upcomingScheduled = await Appointment.find({
      date: { $gte: todayStr },
      status: { $in: ['SCHEDULED', 'RESCHEDULED'] }
    });
    const upcomingCount = upcomingScheduled.filter(appt => !hasAppointmentPassed(appt)).length;

    // Completed sessions count
    const completedCount = await Appointment.countDocuments({
      status: 'COMPLETED'
    });

    // Cancelled sessions count
    const cancelledCount = await Appointment.countDocuments({
      status: 'CANCELLED'
    });

    // Total registered students
    const totalStudents = await User.countDocuments({ role: 'STUDENT' });

    // Total active sessions
    const activeSessionsCount = await InterviewSession.countDocuments({ status: 'ACTIVE' });

    // Blocked dates count
    const blockedDatesCount = await BlockedDate.countDocuments();

    // Recent 5 bookings
    const recentBookings = await Appointment.find()
      .populate('sessionId')
      .sort({ createdAt: -1 })
      .limit(5);

    // Today's bookings list
    const todayBookings = await Appointment.find({ date: todayStr })
      .populate('sessionId')
      .sort({ startTime: 1 });

    // Calendly integration health
    const integration = await CalendlyIntegration.findOne({ isActive: true });

    res.json({
      success: true,
      data: {
        stats: {
          todayAppointments: todayCount,
          upcomingAppointments: upcomingCount,
          completedSessions: completedCount,
          cancelledSessions: cancelledCount,
          totalStudents,
          activeSessionsCount,
          blockedDatesCount
        },
        recentBookings,
        todayBookings,
        integrationStatus: {
          connected: !!integration,
          googleCalendarSynced: integration ? integration.googleCalendarSyncStatus === 'CONNECTED' : true,
          googleCalendarEmail: integration ? integration.googleCalendarEmail : 'counsellor@gmail.com',
          lastWebhookEvent: integration ? integration.lastWebhookEvent : 'None',
          lastWebhookReceivedAt: integration ? integration.lastWebhookReceivedAt : null
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Calendly & Google Calendar Integration settings
// @route   GET /api/admin/integration
// @access  Private (Admin/Counsellor)
const getIntegrationConfig = async (req, res) => {
  try {
    let integration = await CalendlyIntegration.findOne({ isActive: true });

    if (!integration) {
      integration = await CalendlyIntegration.create({
        counsellorId: req.user._id,
        calendly15MinUrl: process.env.CALENDLY_15_MIN_URL || 'https://calendly.com/interview-counsellor/15-min-interview-counselling',
        calendly30MinUrl: process.env.CALENDLY_30_MIN_URL || 'https://calendly.com/interview-counsellor/30-min-mock-interview-training',
        webhookCallbackUrl: `${req.protocol}://${req.get('host')}/api/calendly/webhook`,
        webhookSigningKey: process.env.CALENDLY_WEBHOOK_SIGNING_KEY || 'calendly_whsec_sample_key',
        googleCalendarEmail: 'counsellor.interviews@gmail.com',
        googleCalendarSyncStatus: 'CONNECTED'
      });
    }

    res.json({
      success: true,
      data: integration
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Calendly & Google Calendar Integration settings
// @route   PUT /api/admin/integration
// @access  Private (Admin/Counsellor)
const updateIntegrationConfig = async (req, res) => {
  try {
    const {
      calendly15MinUrl,
      calendly30MinUrl,
      personalAccessToken,
      webhookSigningKey,
      googleCalendarEmail,
      googleCalendarSyncStatus
    } = req.body;

    const integration = await CalendlyIntegration.findOneAndUpdate(
      { isActive: true },
      {
        $set: {
          calendly15MinUrl,
          calendly30MinUrl,
          personalAccessToken,
          webhookSigningKey,
          googleCalendarEmail,
          googleCalendarSyncStatus
        }
      },
      { upsert: true, new: true }
    );

    // Also update Session records with new Calendly URLs if provided
    if (calendly15MinUrl) {
      await InterviewSession.updateMany(
        { duration: 15 },
        { $set: { calendlyEventUrl: calendly15MinUrl } }
      );
    }
    if (calendly30MinUrl) {
      await InterviewSession.updateMany(
        { duration: 30 },
        { $set: { calendlyEventUrl: calendly30MinUrl } }
      );
    }

    res.json({
      success: true,
      message: 'Integration configuration updated successfully',
      data: integration
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private (Admin/Counsellor)
const getAllStudents = async (req, res) => {
  try {
    // Ensure all passed scheduled appointments are marked COMPLETED
    await autoCompletePastAppointments(Appointment);

    const students = await User.find({ role: 'STUDENT' }).sort({ createdAt: -1 });

    const studentData = await Promise.all(
      students.map(async (st) => {
        const cleanEmail = st.email.toLowerCase().trim();
        const emailRegex = new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        const profile = await Student.findOne({ userId: st._id });
        const lastAppointment = await Appointment.findOne({
          $or: [{ studentId: st._id }, { studentEmail: emailRegex }]
        }).sort({ createdAt: -1 });

        const appointmentCount = await Appointment.countDocuments({
          $or: [{ studentId: st._id }, { studentEmail: emailRegex }]
        });

        const resumeUrl = profile?.resumeUrl || lastAppointment?.resumeUrl || '';
        const resumeFileName = profile?.resumeFileName || lastAppointment?.resumeFileName || (resumeUrl ? resumeUrl.split('/').pop() : '');

        return {
          _id: st._id,
          name: st.name,
          email: st.email,
          phone: st.phone,
          createdAt: st.createdAt,
          targetRoles: profile ? profile.targetRoles : [],
          targetCompanies: profile ? profile.targetCompanies : [],
          resumeUrl,
          resumeFileName,
          githubUrl: profile?.githubUrl || lastAppointment?.githubUrl || '',
          linkedinUrl: profile?.linkedinUrl || lastAppointment?.linkedinUrl || '',
          portfolioUrl: profile?.portfolioUrl || lastAppointment?.portfolioUrl || '',
          appointmentCount,
          lastAppointmentDate: lastAppointment ? lastAppointment.date : null,
          lastAppointmentStatus: lastAppointment ? lastAppointment.status : null
        };
      })
    );


    res.json({
      success: true,
      count: studentData.length,
      data: studentData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get notifications for current user
// @route   GET /api/admin/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .populate('appointmentId')
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false
    });

    res.json({
      success: true,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/admin/notifications/:id/read
// @access  Private
const markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getIntegrationConfig,
  updateIntegrationConfig,
  getAllStudents,
  getNotifications,
  markNotificationRead
};
