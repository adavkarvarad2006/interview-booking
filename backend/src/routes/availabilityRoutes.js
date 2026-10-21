const express = require('express');
const router = express.Router();
const {
  getBlockedDates,
  blockDate,
  unblockDate,
  getAvailabilityExplanation,
  getBookedSlots
} = require('../controllers/availabilityController');
const { protect, authorize } = require('../middleware/auth');

router.get('/blocked', getBlockedDates);
router.get('/slots', getBookedSlots);
router.post('/block', protect, authorize('ADMIN', 'COUNSELLOR'), blockDate);
router.delete('/block/:id', protect, authorize('ADMIN', 'COUNSELLOR'), unblockDate);
router.get('/explanation', getAvailabilityExplanation);

module.exports = router;
