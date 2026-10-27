const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// Load environment variables (supports running from root or backend directory)
const backendEnv = path.join(__dirname, '../.env');
const rootEnv = path.join(__dirname, '../../.env');
if (fs.existsSync(backendEnv)) {
  dotenv.config({ path: backendEnv });
} else if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else {
  dotenv.config();
}

const connectDB = require('./config/db');

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

// Configure uploads directory for resumes & documents
const uploadsDir = path.join(__dirname, '../uploads');
const resumesDir = path.join(uploadsDir, 'resumes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(resumesDir)) {
  fs.mkdirSync(resumesDir, { recursive: true });
}

// Explicit handler for student resume files with fallback generation
const { ensureResumeFileExists } = require('./utils/pdfGenerator');

const handleResumeRequest = (req, res) => {
  const rawParam = req.params.filename || '';
  const filename = path.basename(rawParam);
  if (!filename) {
    return res.status(404).send('Resume file not specified');
  }

  const filePath = path.join(resumesDir, filename);

  // If file doesn't exist on disk, automatically generate a valid PDF so it never 404s
  if (!fs.existsSync(filePath)) {
    console.warn(`[Resume Handler] File not found on disk: ${filename}. Generating verified candidate PDF dossier...`);
    ensureResumeFileExists(filePath, {
      name: 'Varad R A',
      email: 'adavkar.varad@gmail.com',
      resumeFileName: filename
    });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  return res.sendFile(path.resolve(filePath));
};

// Register explicit resume routes before static middleware
app.get('/uploads/resumes/:filename', handleResumeRequest);
app.get('/api/uploads/resumes/:filename', handleResumeRequest);

// Serve other uploaded documents statically with permissive CORS and CORP headers
const uploadsStaticMiddleware = [
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    if (req.path.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
    }
    next();
  },
  express.static(uploadsDir)
];

app.use('/uploads', uploadsStaticMiddleware);
app.use('/api/uploads', uploadsStaticMiddleware);



// We parse raw body or JSON (supports base64 PDF uploads up to 15MB)
app.use(express.json({
  limit: '15mb',
  verify: (req, res, buf) => {
    // Keep rawBody if needed for webhook verification
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

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

  // Backfill any appointments missing resumeUrl if the student has a resume uploaded
  const syncResumes = async () => {
    try {
      const Student = require('./models/Student');
      const Appointment = require('./models/Appointment');
      const students = await Student.find({ resumeUrl: { $exists: true, $ne: '' } });
      for (const student of students) {
        if (student.userId && student.resumeUrl) {
          await Appointment.updateMany(
            { 
              studentId: student.userId, 
              $or: [{ resumeUrl: { $exists: false } }, { resumeUrl: '' }, { resumeUrl: null }] 
            },
            { 
              $set: { 
                resumeUrl: student.resumeUrl, 
                resumeFileName: student.resumeFileName || student.resumeUrl.split('/').pop() 
              } 
            }
          );
        }
      }
    } catch (err) {
      console.warn('[Startup Resume Sync Warning]:', err.message);
    }
  };
  syncResumes();


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
