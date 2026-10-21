const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    otp: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index automatically removes expired OTPs
    },
    attempts: {
      type: Number,
      default: 0
    },
    purpose: {
      type: String,
      enum: ['LOGIN', 'REGISTER', 'VERIFICATION'],
      default: 'LOGIN'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Otp', otpSchema);
