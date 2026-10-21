const mongoose = require('mongoose');

const blockedDateSchema = new mongoose.Schema(
  {
    date: {
      type: String, // YYYY-MM-DD
      required: [true, 'Please provide the date to block (YYYY-MM-DD)'],
      unique: true
    },
    reason: {
      type: String,
      required: [true, 'Please provide reason for blocking this date'],
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    syncMethod: {
      type: String,
      enum: ['GOOGLE_CALENDAR_BUSY_EVENT', 'CALENDLY_DATE_OVERRIDE', 'DUAL_SYNC'],
      default: 'DUAL_SYNC'
    },
    calendlySyncStatus: {
      type: String,
      enum: ['ACTIVE_BLOCK', 'PENDING_CONFIRMATION', 'REMOVED'],
      default: 'ACTIVE_BLOCK'
    },
    googleCalendarEventTitle: {
      type: String,
      default: function () {
        return `[BLOCKED - COUNSELLOR UNAVAILABLE] ${this.reason || 'Personal Work'}`;
      }
    },
    calendlyOverrideInstructions: {
      type: String,
      default: 'Calendly reads Google Calendar busy events and removes all time slots for this date automatically.'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('BlockedDate', blockedDateSchema);
