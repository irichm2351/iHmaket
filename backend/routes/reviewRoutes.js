const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/service/:serviceId', reviewController.getServiceReviews);
router.get('/provider/:providerId', reviewController.getProviderReviews);

// Protected routes
router.post('/', protect, reviewController.createReview);
router.put('/:id/respond', protect, reviewController.respondToReview);

module.exports = router;
