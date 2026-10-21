const express = require('express');
const router = express.Router();
const { getCounsellorProfile, updateCounsellorProfile } = require('../controllers/counsellorController');
const { protect, authorize } = require('../middleware/auth');

router.get('/profile', getCounsellorProfile);
router.put('/profile', protect, authorize('ADMIN', 'COUNSELLOR'), updateCounsellorProfile);

module.exports = router;
