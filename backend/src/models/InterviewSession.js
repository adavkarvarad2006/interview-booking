const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide session title'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please provide session description']
    },
    duration: {
      type: Number,
      required: [true, 'Please provide duration in minutes'],
      enum: [15, 30, 45, 60],
      default: 15
    },
    sessionType: {
      type: String,
      required: [true, 'Please provide session type'],
      enum: ['COUNSELLING', 'MOCK_INTERVIEW', 'RESUME_REVIEW', 'SYSTEM_DESIGN'],
      default: 'COUNSELLING'
    },
    calendlyEventUrl: {
      type: String,
      required: [true, 'Please provide Calendly Event URL'],
      trim: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    },
    badge: {
      type: String,
      default: 'Most Popular'
    },
    features: [
      {
        type: String
      }
    ],
    displayOrder: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
