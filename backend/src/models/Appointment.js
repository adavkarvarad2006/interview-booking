const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // May be matched or created via Calendly webhook email
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: false
    },
    calendlyEventId: {
      type: String,
      required: [true, 'Calendly Event URI/ID is required'],
      index: true
    },
    calendlyInviteeId: {
      type: String,
      required: [true, 'Calendly Invitee URI/ID is required'],
      unique: true,
      index: true
    },
    date: {
      type: String, // e.g. "2026-10-15" or ISO date string
      required: true
    },
    startTime: {
      type: String, // e.g. "14:00" or ISO timestamp
      required: true
    },
    endTime: {
      type: String, // e.g. "14:15" or ISO timestamp
      required: true
    },
    duration: {
      type: Number,
      default: 15
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'CANCELLED', 'COMPLETED'],
      default: 'SCHEDULED',
      index: true
    },
    studentName: {
      type: String,
      required: true,
      trim: true
    },
    studentEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    notes: {
      type: String,
      default: ''
    },
    resumeUrl: {
      type: String,
      default: ''
    },
    resumeFileName: {
      type: String,
      default: ''
    },
    githubUrl: {
      type: String,
      default: ''
    },
    linkedinUrl: {
      type: String,
      default: ''
    },
    portfolioUrl: {
      type: String,
      default: ''
    },
    sessionTitle: {
      type: String,
      default: 'Interview Counselling Session'
    },
    sessionType: {
      type: String,
      enum: ['COUNSELLING', 'MOCK_INTERVIEW', 'RESUME_REVIEW', 'SYSTEM_DESIGN'],
      default: 'COUNSELLING'
    },
    rescheduleUrl: {
      type: String,
      default: ''
    },
    cancelUrl: {
      type: String,
      default: ''
    },
    googleCalendarEventUrl: {
      type: String,
      default: ''
    },
    googleMeetLink: {
      type: String,
      default: ''
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    canceledAt: {
      type: Date
    },
    rawCalendlyPayload: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
