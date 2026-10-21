const mongoose = require('mongoose');

const counsellorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    title: {
      type: String,
      default: 'Senior Technical Interview Counsellor & Ex-FAANG Staff Engineer'
    },
    headline: {
      type: String,
      default: 'Helping engineers land top tech offers through rigorous mock interviews and personalized career guidance.'
    },
    experienceYears: {
      type: Number,
      default: 12
    },
    companiesPast: [
      {
        type: String,
        trim: true
      }
    ],
    expertiseAreas: [
      {
        type: String,
        trim: true
      }
    ],
    hourlyRate: {
      type: Number,
      default: 0 // Free / sponsored counselling or standard fee
    },
    rating: {
      type: Number,
      default: 4.95
    },
    totalReviews: {
      type: Number,
      default: 142
    },
    totalSessionsCompleted: {
      type: Number,
      default: 520
    },
    calendlyUserUri: {
      type: String,
      default: ''
    },
    calendlySchedulingUrl: {
      type: String,
      default: 'https://calendly.com/interview-counsellor'
    },
    googleCalendarEmail: {
      type: String,
      default: 'counsellor@interviewprep.org'
    },
    googleCalendarSyncActive: {
      type: Boolean,
      default: true
    },
    department: {
      type: String,
      default: 'Department of CSE(AI & ML) and CSE(CS)'
    },
    institution: {
      type: String,
      default: 'Ramaiah Institute of Technology, Bengaluru'
    },
    educationDetails: [
      {
        degree: { type: String },
        year: { type: String },
        university: { type: String }
      }
    ],
    subjectsTaught: [
      {
        type: String
      }
    ],
    publicationsCount: {
      type: Number,
      default: 112
    },
    patentsCount: {
      type: Number,
      default: 18
    },
    socialLinks: {
      linkedin: { type: String, default: 'https://linkedin.com' },
      github: { type: String, default: 'https://github.com' },
      twitter: { type: String, default: 'https://twitter.com' },
      vidwan: { type: String, default: 'https://vidwan.inflibnet.ac.in/' }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Counsellor', counsellorSchema);

