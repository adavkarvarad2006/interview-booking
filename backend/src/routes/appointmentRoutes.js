const express = require('express');
const router = express.Router();
const {
  getMyAppointments,
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  rescheduleAppointment,
  updateAppointmentContext,
  getAppointmentResume
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

router.get('/my', protect, getMyAppointments);
router.get('/', protect, authorize('ADMIN', 'COUNSELLOR'), getAllAppointments);
router.get('/:id/resume', getAppointmentResume);
router.get('/:id', protect, getAppointmentById);
router.patch('/:id/status', protect, authorize('ADMIN', 'COUNSELLOR'), updateAppointmentStatus);
router.patch('/:id/context', protect, updateAppointmentContext);
router.post('/:id/cancel', protect, cancelAppointment);
router.post('/:id/reschedule', protect, rescheduleAppointment);

module.exports = router;

