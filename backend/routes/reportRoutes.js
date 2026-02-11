const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createReport,
  getAllReports,
  updateReportStatus,
  deleteReport
} = require('../controllers/reportController');

router.post('/', protect, createReport);
router.get('/', protect, authorize('admin'), getAllReports);
router.put('/:id/status', protect, authorize('admin'), updateReportStatus);
router.delete('/:id', protect, authorize('admin'), deleteReport);

module.exports = router;
