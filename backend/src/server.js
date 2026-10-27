const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    return callback(null, true); // Dev permissive
  },
  credentials: true
}));

// We parse raw body or JSON
app.use(express.json({
  verify: (req, res, buf) => {
    // Keep rawBody if needed for webhook verification
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
  });
}

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/calendly', require('./routes/webhookRoutes'));
app.use('/api/availability', require('./routes/availabilityRoutes'));
app.use('/api/counsellor', require('./routes/counsellorRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Interview Counselling Booking Platform API',
    integrations: {
      calendly: 'Active (Primary Scheduling Source of Truth)',
      googleCalendar: 'Active (Conflict & Sync Hub)'
    }
  });
});

// OOAD Architectural Specification Endpoint
app.get('/api/architecture', (req, res) => {
  res.json({
    classes: [
      'User',
      'Student',
      'Counsellor',
      'InterviewSession',
      'Appointment',
      'Notification',
      'CalendlyIntegration',
      'BlockedDate'
    ],
    primaryScheduler: 'Calendly',
    calendarSync: 'Google Calendar',
    relationships: [
      'Student books Appointment for InterviewSession',
      'Appointment scheduled through CalendlyIntegration',
      'Calendly synchronizes with Google Calendar',
      'Counsellor manages InterviewSession, configures CalendlyIntegration, and manages BlockedDate'
    ]
  });
});

// Serve static frontend in production if dist exists (enables single-service fullstack deployment)
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const { verifyEmailTransporter } = require('./services/emailService');
const { autoCompletePastAppointments } = require('./utils/timeConflict');

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 Interview Counselling Server running on port ${PORT}`);
  console.log(`📅 Primary Scheduling Platform: Calendly`);
  console.log(`📆 Calendar Integration: Google Calendar`);
  console.log(`🔗 Webhook Endpoint: http://localhost:${PORT}/api/calendly/webhook`);
  
  // Auto-complete any appointments whose scheduled time has already passed
  autoCompletePastAppointments().catch(err => {
    console.error('[Startup Auto-Complete Warning]:', err.message);
  });

  // Run periodic background check every 60 seconds
  setInterval(() => {
    autoCompletePastAppointments().catch(err => {
      console.error('[Background Auto-Complete Error]:', err.message);
    });
  }, 60000);

  // Verify Nodemailer Email Transporter
  verifyEmailTransporter().then(status => {
    if (status.verified) {
      console.log(`📧 [Email Service] ✅ Nodemailer SMTP verified and ready to send real emails!`);
    } else if (!status.configured) {
      console.log(`📧 [Email Service] ℹ️ SMTP not configured in backend/.env. OTP runs in simulated mode.`);
    } else {
      console.warn(`📧 [Email Service] ⚠️ SMTP connection warning: ${status.error}`);
      if (status.hint) {
        console.warn(`📧 [Email Service] 💡 Hint: ${status.hint}`);
      }
    }
  }).catch(err => {
    console.warn(`📧 [Email Service] Transporter check error:`, err.message);
  });

  console.log(`=======================================================`);
});
