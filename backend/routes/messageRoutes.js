const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// All routes are protected
// Specific routes must come before generic ones to avoid parameter conflicts

// GET /messages/unread-count - Get unread message count
router.get('/unread-count', protect, messageController.getUnreadCount);

// POST /messages - Send a message
router.post('/', protect, messageController.sendMessage);

// POST /messages/bulk/send-all - Send bulk message from admin
router.post('/bulk/send-all', protect, messageController.sendBulkMessage);

// GET /messages/conversations - Get all conversations
router.get('/conversations', protect, messageController.getConversations);

// GET /messages/:userId - Get messages with a specific user
router.get('/:userId', protect, messageController.getMessages);

// PUT /messages/:id - Update/edit a message by ID
// Using explicit regex to ensure it's a valid MongoDB ObjectId (24 hex chars)
router.put('/:id([0-9a-fA-F]{24})', protect, messageController.updateMessage);

// PUT /messages/:userId/read - Mark messages as read
router.put('/:userId/read', protect, messageController.markAsRead);

// DELETE /messages/conversation/:userId - Delete entire conversation
router.delete('/conversation/:userId', protect, messageController.deleteConversation);

// DELETE /messages/:id - Delete a single message by ID
// Using explicit regex to ensure it's a valid MongoDB ObjectId (24 hex chars)
router.delete('/:id([0-9a-fA-F]{24})', protect, messageController.deleteMessage);

module.exports = router;
