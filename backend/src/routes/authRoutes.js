const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getMe, 
  updateProfile,
  uploadResume,
  serveResumeFile,
  deleteResume,
  sendOtp,
  verifyOtp
} = require('../controllers/authController');
const { protect, optionalProtect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/upload-resume', optionalProtect, uploadResume);
router.get('/resume-file/:filename', serveResumeFile);
router.delete('/resume', protect, deleteResume);

module.exports = router;

