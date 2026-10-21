const express = require('express');
const router = express.Router();
const {
  getMyAppointments,
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

router.get('/my', protect, getMyAppointments);
router.get('/', protect, authorize('ADMIN', 'COUNSELLOR'), getAllAppointments);
router.get('/:id', protect, getAppointmentById);
router.patch('/:id/status', protect, authorize('ADMIN', 'COUNSELLOR'), updateAppointmentStatus);

module.exports = router;
