const express = require('express');
const router = express.Router();
const {
  getPublicSessions,
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession
} = require('../controllers/sessionController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getPublicSessions);
router.get('/all', protect, authorize('ADMIN', 'COUNSELLOR'), getAllSessions);
router.get('/:id', getSessionById);
router.post('/', protect, authorize('ADMIN', 'COUNSELLOR'), createSession);
router.put('/:id', protect, authorize('ADMIN', 'COUNSELLOR'), updateSession);
router.delete('/:id', protect, authorize('ADMIN', 'COUNSELLOR'), deleteSession);

module.exports = router;
