const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    targetRoles: [
      {
        type: String,
        trim: true
      }
    ],
    targetCompanies: [
      {
        type: String,
        trim: true
      }
    ],
    education: {
      type: String,
      default: ''
    },
    experienceLevel: {
      type: String,
      enum: ['STUDENT', 'ENTRY_LEVEL', 'MID_LEVEL', 'SENIOR', 'CAREER_CHANGER'],
      default: 'STUDENT'
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
    preparationNotes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Student', studentSchema);
