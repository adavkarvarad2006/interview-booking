const User = require('../models/User');
const Student = require('../models/Student');
const Counsellor = require('../models/Counsellor');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('../services/emailService');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecret_counselling_jwt_key_2026_super_safe', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role = 'STUDENT', phone, targetRoles, targetCompanies } = req.body;

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role === 'COUNSELLOR' || role === 'ADMIN' ? role : 'STUDENT',
      phone: phone || ''
    });

    if (user.role === 'STUDENT') {
      await Student.create({
        userId: user._id,
        targetRoles: targetRoles || ['Software Engineer', 'Full Stack Developer'],
        targetCompanies: targetCompanies || ['Google', 'Amazon', 'Microsoft']
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        token
      }
    });
  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const cleanEmail = (email || '').toLowerCase().trim();
    const emailAliases = [cleanEmail];
    if (['counsellor@interviewprep.org', 'admin@interviewprep.org', 'counsellor@msrit.edu'].includes(cleanEmail)) {
      emailAliases.push('parkavi.a@msrit.edu');
    }

    const user = await User.findOne({ email: { $in: emailAliases } }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        bio: user.bio,
        token
      }
    });
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let profileData = {};

    if (user.role === 'STUDENT') {
      const student = await Student.findOne({ userId: user._id });
      profileData = student ? student.toObject() : {};
    } else {
      const counsellor = await Counsellor.findOne({ userId: user._id });
      profileData = counsellor ? counsellor.toObject() : {};
    }

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        profile: profileData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, avatar, studentDetails, counsellorDetails } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    if (user.role === 'STUDENT' && studentDetails) {
      await Student.findOneAndUpdate(
        { userId: user._id },
        { $set: studentDetails },
        { upsert: true, new: true }
      );
    } else if (counsellorDetails && (user.role === 'COUNSELLOR' || user.role === 'ADMIN')) {
      await Counsellor.findOneAndUpdate(
        { userId: user._id },
        { $set: counsellorDetails },
        { upsert: true, new: true }
      );
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send OTP to user email for passwordless login
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Generate 6-digit random code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this email to avoid clutter
    await Otp.deleteMany({ email: cleanEmail });

    // Save new OTP
    await Otp.create({
      email: cleanEmail,
      otp,
      expiresAt,
      attempts: 0,
      purpose: 'LOGIN'
    });

    // Send the email (or log to console in dev)
    await sendOtpEmail(cleanEmail, otp);

    const isDev = process.env.NODE_ENV !== 'production';

    res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${cleanEmail}`,
      email: cleanEmail,
      expiresInMinutes: 10,
      devOtp: isDev ? otp : undefined
    });
  } catch (error) {
    console.error('[Send OTP Error]', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send verification code' });
  }
};

// @desc    Verify OTP and log in / auto-provision student account
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and verification code' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    // Alias mapping for counsellor admin
    const emailAliases = [cleanEmail];
    if (['counsellor@interviewprep.org', 'admin@interviewprep.org', 'counsellor@msrit.edu'].includes(cleanEmail)) {
      emailAliases.push('parkavi.a@msrit.edu');
    }

    // Find the latest active OTP
    const otpRecord = await Otp.findOne({
      email: { $in: emailAliases },
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Verification code has expired or is invalid. Please request a new code.' });
    }

    if (otpRecord.attempts >= 5) {
      await Otp.deleteMany({ email: { $in: emailAliases } });
      return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please request a new verification code.' });
    }

    if (otpRecord.otp !== cleanOtp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ 
        success: false, 
        message: `Incorrect code. ${5 - otpRecord.attempts} attempt(s) remaining.` 
      });
    }

    // Clean up used OTP
    await Otp.deleteMany({ email: { $in: emailAliases } });

    // Find existing user or auto-create student
    let user = await User.findOne({ email: { $in: emailAliases } });

    if (!user) {
      // Auto-provision student profile for seamless passwordless onboarding
      const defaultName = cleanEmail.split('@')[0]
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      user = await User.create({
        name: defaultName || 'Student',
        email: cleanEmail,
        password: `OtpUser@${Date.now()}!`,
        role: 'STUDENT',
        phone: ''
      });

      await Student.create({
        userId: user._id,
        targetRoles: ['Software Engineer', 'Full Stack Developer'],
        targetCompanies: ['Google', 'Amazon', 'Microsoft']
      });

      console.log(`[OTP Login] Auto-provisioned new student account for ${cleanEmail}`);
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'OTP verified successfully. Welcome to InterviewPrep!',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        bio: user.bio,
        token
      }
    });
  } catch (error) {
    console.error('[Verify OTP Error]', error);
    res.status(500).json({ success: false, message: error.message || 'OTP verification failed' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  sendOtp,
  verifyOtp
};
