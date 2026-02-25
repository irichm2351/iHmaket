const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { protect } = require('../middleware/auth');

// User creates support ticket (when opening chat)
router.post('/tickets/create', protect, supportController.createSupportTicket);

// User creates support message (starts ticket)
router.post('/messages', protect, supportController.createSupportMessage);

// Admin views open tickets
router.get('/tickets/open', protect, supportController.getOpenTickets);

// Admin claims ticket
router.post('/tickets/:ticketId/claim', protect, supportController.claimTicket);

module.exports = router;
