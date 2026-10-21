const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getIntegrationConfig,
  updateIntegrationConfig,
  getAllStudents,
  getNotifications,
  markNotificationRead
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard-stats', protect, authorize('ADMIN', 'COUNSELLOR'), getDashboardStats);
router.get('/integration', protect, authorize('ADMIN', 'COUNSELLOR'), getIntegrationConfig);
router.put('/integration', protect, authorize('ADMIN', 'COUNSELLOR'), updateIntegrationConfig);
router.get('/students', protect, authorize('ADMIN', 'COUNSELLOR'), getAllStudents);
router.get('/notifications', protect, getNotifications);
router.patch('/notifications/:id/read', protect, markNotificationRead);

module.exports = router;
