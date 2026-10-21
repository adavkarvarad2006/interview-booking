const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');

// @desc    Get appointments for the logged-in student
// @route   GET /api/appointments/my
// @access  Private (Student)
const getMyAppointments = async (req, res) => {
  try {
    const studentEmail = req.user.email.toLowerCase();
    const studentId = req.user._id;

    const appointments = await Appointment.find({
      $or: [{ studentId: studentId }, { studentEmail: studentEmail }]
    })
      .populate('sessionId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
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

    res.json({
      success: true,
      total,
      count: appointments.length,
      page: Number(page),
      data: appointments
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
    const appointment = await Appointment.findById(req.params.id).populate('sessionId');
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Ensure authorized user (Admin or Appointment owner)
    if (
      req.user.role === 'STUDENT' &&
      appointment.studentEmail !== req.user.email.toLowerCase() &&
      String(appointment.studentId) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this appointment' });
    }

    res.json({
      success: true,
      data: appointment
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

module.exports = {
  getMyAppointments,
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus
};
