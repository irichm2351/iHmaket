const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

// Public settings
router.get('/settings', subscriptionController.getSubscriptionSettings);
router.get('/health', subscriptionController.getSubscriptionHealth);

// Protected routes
router.get('/status', protect, subscriptionController.getSubscriptionStatus);
router.post('/initialize', protect, subscriptionController.initializeSubscription);
router.get('/verify/:reference', protect, subscriptionController.verifySubscription);

// Webhook (no auth)
router.post('/webhook', subscriptionController.handleWebhook);

module.exports = router;
