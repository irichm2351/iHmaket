const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { requireActiveSubscription } = require('../middleware/subscription');

// All routes are protected
router.post('/', protect, bookingController.createBooking);
router.get('/pending-count', protect, bookingController.getPendingCount);
router.get('/', protect, bookingController.getMyBookings);
router.get('/:id', protect, bookingController.getBookingById);
router.put('/:id/status', protect, requireActiveSubscription, bookingController.updateBookingStatus);
router.put('/:id/cancel', protect, bookingController.cancelBooking);

module.exports = router;
