require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Counsellor = require('../models/Counsellor');
const InterviewSession = require('../models/InterviewSession');
const Appointment = require('../models/Appointment');
const BlockedDate = require('../models/BlockedDate');
const CalendlyIntegration = require('../models/CalendlyIntegration');
const Notification = require('../models/Notification');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/interview_counselling_db';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB at:', mongoUri);

    // Clear existing data
    await User.deleteMany();
    await Student.deleteMany();
    await Counsellor.deleteMany();
    await InterviewSession.deleteMany();
    await Appointment.deleteMany();
    await BlockedDate.deleteMany();
    await CalendlyIntegration.deleteMany();
    await Notification.deleteMany();

    console.log('[Seed] Cleared old collections');

    // 1. Create Counsellor / Admin User (Dr. Parkavi A.)
    const counsellorUser = await User.create({
      name: 'Dr. Parkavi A.',
      email: 'parkavi.a@msrit.edu',
      password: 'Password123!',
      role: 'ADMIN',
      phone: 'none',
      avatar: '/dr-parkavi.jpg',
      bio: 'Dr. Parkavi A. is working as Professor in the Department of CSE(AI & ML) and CSE(CS) at Ramaiah Institute of Technology, Bengaluru. Her research interests include AI, ML, EDM, IoT, and AI-driven healthcare and agriculture. She has 21 years of teaching experience, 112 research publications, 14 book chapters, 3 granted and 15 published patents, guided 50+ student projects, carried out 8 consultancy projects and MoU, NPTEL translation review project, 4 seed funded projects, received 8 IEEE funds($2000) for events conductions, and organized 30+ IEEE Events. Her work focuses on developing innovative technology solutions for sustainable education, healthcare, and agriculture.'
    });

    // 2. Create Counsellor Profile
    const counsellorProfile = await Counsellor.create({
      userId: counsellorUser._id,
      title: 'Professor | Dept of CSE(AI & ML) & CSE(CS)',
      headline: 'Professor at Ramaiah Institute of Technology, Bengaluru with 21+ Years of Teaching & Research Experience in AI, ML, Computer Vision & Academic Mentorship.',
      department: 'Department of CSE(AI & ML) and CSE(CS)',
      institution: 'Ramaiah Institute of Technology, Bengaluru',
      experienceYears: 21,
      companiesPast: ['Ramaiah Institute of Technology', 'Periyar Maniammai Institute', 'Anna University', 'IEEE'],
      expertiseAreas: [
        'Artificial Intelligence & Machine Learning',
        'Educational Data Mining & Learning Analytics',
        'Data Analytics & Predictive Analytics',
        'Deep Learning & Computer Vision',
        'IoT & Smart Systems'
      ],
      educationDetails: [
        { degree: 'Ph.D', year: '2018', university: 'Periyar Maniammai Institute of Science and Technology(Deemed to be University),Thanjavur' },
        { degree: 'M.E', year: '2005', university: 'Anna University' },
        { degree: 'B.E', year: '2001', university: 'Bharathidasan University' }
      ],
      subjectsTaught: [
        'Block Chain Technology',
        'Data Structures',
        'Operating Systems',
        'Software Engineering',
        'Compiler Design'
      ],
      publicationsCount: 112,
      patentsCount: 18,
      hourlyRate: 0, // Complimentary counselling as part of institutional initiative
      rating: 4.99,
      totalReviews: 112,
      totalSessionsCompleted: 580,
      calendlyUserUri: 'https://api.calendly.com/users/USR_PARKAVI_A',
      calendlySchedulingUrl: 'https://calendly.com/interview-counsellor',
      googleCalendarEmail: 'parkavi.a@msrit.edu',
      googleCalendarSyncActive: true
    });

    // 3. Create Student Users
    const student1 = await User.create({
      name: 'Emily Watson',
      email: 'emily.watson@gmail.com',
      password: 'Password123!',
      role: 'STUDENT',
      phone: '+1 (555) 123-4567',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      bio: 'Computer Science Master’s student preparing for Summer 2027 SWE Internships and New Grad roles.'
    });
    await Student.create({
      userId: student1._id,
      targetRoles: ['Software Engineer', 'Full Stack Developer'],
      targetCompanies: ['Google', 'Amazon', 'Bloomberg'],
      education: 'MS Computer Science, Carnegie Mellon University',
      experienceLevel: 'STUDENT',
      preparationNotes: 'Need focus on binary trees, graph algorithms, and system design basics.'
    });

    const student2 = await User.create({
      name: 'David Chen',
      email: 'david.chen@gmail.com',
      password: 'Password123!',
      role: 'STUDENT',
      phone: '+1 (555) 987-6543',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      bio: 'Senior Backend Engineer targeting Staff/L6 roles at Tier-1 tech firms.'
    });
    await Student.create({
      userId: student2._id,
      targetRoles: ['Staff Software Engineer', 'Distributed Systems Architect'],
      targetCompanies: ['Meta', 'Netflix', 'Uber'],
      education: 'BS Computer Science, UC Berkeley',
      experienceLevel: 'SENIOR',
      preparationNotes: 'Seeking rigorous mock for high-throughput distributed database system design.'
    });

    // 4. Create Official Interview Sessions (15-min and 30-min as specified in prompt)
    const session15 = await InterviewSession.create({
      title: 'Quick Interview Counselling',
      duration: 15,
      sessionType: 'COUNSELLING',
      calendlyEventUrl: process.env.CALENDLY_15_MIN_URL || 'https://calendly.com/interview-counsellor/15-min-interview-counselling',
      status: 'ACTIVE',
      badge: 'Quick Strategy Session',
      displayOrder: 1,
      description: 'A focused 15-minute 1-on-1 strategy meeting designed to review immediate interview blockers, resume red-flags, interview pipeline pacing, or personalized company preparation advice.',
      features: [
        'Rapid resume & LinkedIn profile diagnosis',
        'Clarification on interview structure & expectations',
        'Targeted roadmap for DSA or System Design preparation',
        'Direct Q&A with ex-FAANG interviewer'
      ]
    });

    const session30 = await InterviewSession.create({
      title: 'Mock Interview & Training',
      duration: 30,
      sessionType: 'MOCK_INTERVIEW',
      calendlyEventUrl: process.env.CALENDLY_30_MIN_URL || 'https://calendly.com/interview-counsellor/30-min-mock-interview-training',
      status: 'ACTIVE',
      badge: 'Deep Simulation',
      displayOrder: 2,
      description: 'A comprehensive 30-minute realistic technical or behavioral mock interview simulation under actual FAANG conditions, followed by immediate actionable critique and rubric scoring.',
      features: [
        'Live 20-min coding or system design problem scenario',
        'Evaluation on problem-solving, code quality & communication',
        '10-min live actionable debrief & scoring breakdown',
        'Official rubric feedback sheet sent to your student portal'
      ]
    });

    console.log('[Seed] Created Interview Sessions (15m and 30m)');

    // 5. Create Calendly Integration Configuration
    await CalendlyIntegration.create({
      counsellorId: counsellorUser._id,
      personalAccessToken: 'cal_pat_demo_token_marcus_vance_2026',
      organizationUri: 'https://api.calendly.com/organizations/ORG_MARCUS_COUNSELLING',
      userUri: 'https://api.calendly.com/users/USR_MARCUS_VANCE',
      webhookSigningKey: 'calendly_whsec_sample_secret_key_2026',
      webhookSubscriptionUri: 'https://api.calendly.com/webhook_subscriptions/SUB_INTERVIEW_PORTAL',
      webhookCallbackUrl: 'http://localhost:5000/api/calendly/webhook',
      calendly15MinUrl: session15.calendlyEventUrl,
      calendly30MinUrl: session30.calendlyEventUrl,
      googleCalendarEmail: 'counsellor.interviews@gmail.com',
      googleCalendarSyncStatus: 'CONNECTED',
      googleCalendarName: 'Dr. Marcus Vance (Primary Calendar)',
      lastWebhookReceivedAt: new Date(Date.now() - 3600000),
      lastWebhookEvent: 'invitee.created',
      isActive: true
    });

    // 6. Create Blocked Date (Matching prompt example: "20 October 2026", "Personal Work")
    const blockedDate = await BlockedDate.create({
      date: '2026-10-20',
      reason: 'Personal Work',
      createdBy: counsellorUser._id,
      syncMethod: 'DUAL_SYNC',
      calendlySyncStatus: 'ACTIVE_BLOCK',
      googleCalendarEventTitle: '[BLOCKED - COUNSELLOR UNAVAILABLE] Personal Work',
      calendlyOverrideInstructions: 'Calendly checks Google Calendar for Busy events and automatically closes all appointment slots for 20 October 2026.'
    });

    console.log('[Seed] Created Blocked Date:', blockedDate.date, blockedDate.reason);

    // 7. Create Sample Appointments via Calendly
    const appointment1 = await Appointment.create({
      studentId: student1._id,
      sessionId: session15._id,
      calendlyEventId: 'https://api.calendly.com/scheduled_events/EVT_SEED_001',
      calendlyInviteeId: 'https://api.calendly.com/scheduled_events/EVT_SEED_001/invitees/INV_SEED_001',
      date: '2026-10-15',
      startTime: '10:00 AM',
      endTime: '10:15 AM',
      duration: 15,
      status: 'SCHEDULED',
      studentName: student1.name,
      studentEmail: student1.email,
      sessionTitle: session15.title,
      sessionType: 'COUNSELLING',
      notes: 'Focus on Google L4 SWE intern interview preparation and technical resume polish.',
      rescheduleUrl: '',
      cancelUrl: '',
      googleCalendarEventUrl: 'https://calendar.google.com/calendar'
    });

    const appointment2 = await Appointment.create({
      studentId: student2._id,
      sessionId: session30._id,
      calendlyEventId: 'https://api.calendly.com/scheduled_events/EVT_SEED_002',
      calendlyInviteeId: 'https://api.calendly.com/scheduled_events/EVT_SEED_002/invitees/INV_SEED_002',
      date: '2026-10-18',
      startTime: '02:00 PM',
      endTime: '02:30 PM',
      duration: 30,
      status: 'SCHEDULED',
      studentName: student2.name,
      studentEmail: student2.email,
      sessionTitle: session30.title,
      sessionType: 'MOCK_INTERVIEW',
      notes: 'Distributed cache & message queue architecture mock session with live feedback.',
      rescheduleUrl: '',
      cancelUrl: '',
      googleCalendarEventUrl: 'https://calendar.google.com/calendar'
    });

    const appointment3 = await Appointment.create({
      studentId: student1._id,
      sessionId: session15._id,
      calendlyEventId: 'https://api.calendly.com/scheduled_events/EVT_SEED_003',
      calendlyInviteeId: 'https://api.calendly.com/scheduled_events/EVT_SEED_003/invitees/INV_SEED_003',
      date: '2026-09-25',
      startTime: '11:00 AM',
      endTime: '11:15 AM',
      duration: 15,
      status: 'COMPLETED',
      studentName: student1.name,
      studentEmail: student1.email,
      sessionTitle: session15.title,
      sessionType: 'COUNSELLING',
      notes: 'Initial alignment on target tier-1 tech firms and career roadmap.',
      rescheduleUrl: '',
      cancelUrl: ''
    });

    // 8. Create Sample Notifications
    await Notification.create({
      userId: counsellorUser._id,
      title: 'New Booking via Calendly',
      message: 'Emily Watson booked Quick Interview Counselling for 2026-10-15 at 10:00 AM.',
      type: 'BOOKING_CREATED',
      appointmentId: appointment1._id
    });

    await Notification.create({
      userId: student1._id,
      title: 'Interview Session Confirmed!',
      message: 'Your 15-minute Quick Interview Counselling is booked for 2026-10-15 at 10:00 AM.',
      type: 'BOOKING_CREATED',
      appointmentId: appointment1._id
    });

    console.log('[Seed] Database successfully seeded with Counsellor, Students, Sessions, Calendly Integration & Appointments!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
};

seedDatabase();
