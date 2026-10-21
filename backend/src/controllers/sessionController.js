const InterviewSession = require('../models/InterviewSession');

// @desc    Get active interview sessions for public booking
// @route   GET /api/sessions
// @access  Public
const getPublicSessions = async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ status: 'ACTIVE' }).sort({ displayOrder: 1, duration: 1 });
    res.json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all interview sessions for admin management
// @route   GET /api/sessions/all
// @access  Private (Admin/Counsellor)
const getAllSessions = async (req, res) => {
  try {
    const sessions = await InterviewSession.find().sort({ displayOrder: 1, duration: 1 });
    res.json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single interview session
// @route   GET /api/sessions/:id
// @access  Public
const getSessionById = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session type not found' });
    }
    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new interview session type
// @route   POST /api/sessions
// @access  Private (Admin/Counsellor)
const createSession = async (req, res) => {
  try {
    const { title, description, duration, sessionType, calendlyEventUrl, status, badge, features, displayOrder } = req.body;

    const session = await InterviewSession.create({
      title,
      description,
      duration: Number(duration) || 15,
      sessionType: sessionType || 'COUNSELLING',
      calendlyEventUrl,
      status: status || 'ACTIVE',
      badge: badge || '',
      features: features || [],
      displayOrder: Number(displayOrder) || 1
    });

    res.status(201).json({
      success: true,
      message: 'Session type created successfully',
      data: session
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update interview session
// @route   PUT /api/sessions/:id
// @access  Private (Admin/Counsellor)
const updateSession = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const updated = await InterviewSession.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Session updated successfully',
      data: updated
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete interview session
// @route   DELETE /api/sessions/:id
// @access  Private (Admin/Counsellor)
const deleteSession = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    await InterviewSession.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPublicSessions,
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession
};
