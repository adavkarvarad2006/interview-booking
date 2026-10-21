const User = require('../models/User');
const Counsellor = require('../models/Counsellor');

// @desc    Get public counsellor profile
// @route   GET /api/counsellor/profile
// @access  Public
const getCounsellorProfile = async (req, res) => {
  try {
    const counsellorUser = await User.findOne({ role: { $in: ['COUNSELLOR', 'ADMIN'] } });
    if (!counsellorUser) {
      return res.status(404).json({ success: false, message: 'Counsellor profile not configured' });
    }

    let profile = await Counsellor.findOne({ userId: counsellorUser._id });
    if (!profile) {
      profile = await Counsellor.create({
        userId: counsellorUser._id,
        title: 'Professor | Dept of CSE(AI & ML) & CSE(CS)',
        headline: 'Professor at Ramaiah Institute of Technology with 21+ Years Experience in AI, ML, Data Science & Academic Counselling',
        experienceYears: 21,
        department: 'Department of CSE(AI & ML) and CSE(CS)',
        institution: 'Ramaiah Institute of Technology, Bengaluru',
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
        ]
      });
    }

    res.json({
      success: true,
      data: {
        name: counsellorUser.name,
        email: counsellorUser.email,
        phone: counsellorUser.phone,
        avatar: counsellorUser.avatar,
        bio: counsellorUser.bio,
        ...profile.toObject()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update counsellor profile
// @route   PUT /api/counsellor/profile
// @access  Private (Admin/Counsellor)
const updateCounsellorProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      bio,
      avatar,
      title,
      headline,
      experienceYears,
      companiesPast,
      expertiseAreas,
      hourlyRate,
      calendlySchedulingUrl,
      googleCalendarEmail
    } = req.body;

    const counsellorUser = await User.findById(req.user._id);
    if (!counsellorUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) counsellorUser.name = name;
    if (phone !== undefined) counsellorUser.phone = phone;
    if (bio !== undefined) counsellorUser.bio = bio;
    if (avatar !== undefined) counsellorUser.avatar = avatar;
    await counsellorUser.save();

    const counsellorProfile = await Counsellor.findOneAndUpdate(
      { userId: counsellorUser._id },
      {
        $set: {
          title,
          headline,
          experienceYears,
          companiesPast,
          expertiseAreas,
          hourlyRate,
          calendlySchedulingUrl,
          googleCalendarEmail
        }
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Counsellor profile updated successfully',
      data: {
        name: counsellorUser.name,
        email: counsellorUser.email,
        avatar: counsellorUser.avatar,
        bio: counsellorUser.bio,
        ...counsellorProfile.toObject()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCounsellorProfile,
  updateCounsellorProfile
};
