const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { protect } = require('../middleware/auth');

// DEBUG: Check online admins status
router.get('/debug/online-admins', protect, supportController.getDebugOnlineAdmins);

// User creates support message (starts ticket)
router.post('/messages', protect, supportController.createSupportMessage);

// Get support messages for a ticket
router.get('/messages/:ticketId', protect, supportController.getSupportMessages);

// Send support message (user or admin)
router.post('/tickets/:ticketId/message', protect, supportController.sendSupportMessage);

// Admin views open tickets
router.get('/tickets/open', protect, supportController.getOpenTickets);

// Get ticket details
router.get('/tickets/:ticketId', protect, supportController.getTicketDetails);

// Admin claims ticket
router.post('/tickets/:ticketId/claim', protect, supportController.claimTicket);

// Admin accepts support request
router.post('/tickets/:ticketId/accept', protect, supportController.acceptSupportRequest);

// Update ticket status
router.put('/tickets/:ticketId/status', protect, supportController.updateTicketStatus);

module.exports = router;
