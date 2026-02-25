const Message = require('../models/Message');
const User = require('../models/User');
const SupportTicket = require('../models/SupportTicket');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;

    console.log('=== SEND MESSAGE ===');
    console.log('Sender ID:', req.user._id);
    console.log('Receiver ID:', receiverId);
    console.log('Text:', text);

    const conversationId = Message.generateConversationId(req.user._id, receiverId);

    const message = await Message.create({
      conversationId,
      senderId: req.user._id,
      receiverId,
      text
    });

    console.log('Message created with ID:', message._id);
    console.log('Message ID type:', typeof message._id);
    console.log('Message ID as string:', message._id.toString());

    await message.populate('senderId receiverId', 'name profilePic');

    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');

    if (req.user.role === 'admin') {
      const openTicket = await SupportTicket.findOne({
        userId: receiverId,
        status: 'open'
      });

      if (openTicket) {
        openTicket.status = 'assigned';
        openTicket.assignedAdminId = req.user._id;
        await openTicket.save();

        const userSocketId = onlineUsers.get(receiverId.toString());
        if (userSocketId) {
          io.to(userSocketId).emit('support_assigned', {
            ticketId: openTicket._id,
            userId: receiverId,
            admin: {
              _id: req.user._id,
              name: req.user.name,
              profilePic: req.user.profilePic
            }
          });
        }
      }
    }

    // Emit socket event to the receiver
    const recipientSocketId = onlineUsers.get(receiverId.toString());
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receive_message', {
        senderId: message.senderId,
        receiverId: message.receiverId,
        text: message.text,
        _id: message._id,
        createdAt: message.createdAt
      });
      // Also emit notification event
      io.to(recipientSocketId).emit('new-message', {
        senderId: message.senderId._id,
        senderName: message.senderId.name,
        text: message.text
      });
    }

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiverId: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      count: unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count',
      error: error.message
    });
  }
};

// @desc    Get conversations list
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    // Get all unique conversation partners
    const messages = await Message.find({
      $or: [
        { senderId: req.user._id },
        { receiverId: req.user._id }
      ]
    }).sort({ createdAt: -1 });

    // Extract unique users
    const userIds = new Set();
    messages.forEach(msg => {
      const otherId = msg.senderId.toString() === req.user._id.toString() 
        ? msg.receiverId.toString() 
        : msg.senderId.toString();
      userIds.add(otherId);
    });

    // Get conversations with last message
    const conversations = [];
    
    for (const userId of userIds) {
      const conversationId = Message.generateConversationId(req.user._id, userId);
      
      const lastMessage = await Message.findOne({ conversationId })
        .sort({ createdAt: -1 })
        .populate('senderId receiverId', 'name profilePic');

      const unreadCount = await Message.countDocuments({
        conversationId,
        receiverId: req.user._id,
        isRead: false
      });

      const otherUser = await User.findById(userId).select('name profilePic role');

      if (!otherUser) {
        continue;
      }

      if (req.user.role !== 'admin' && otherUser.role === 'admin') {
        continue;
      }

      conversations.push({
        user: otherUser,
        lastMessage,
        unreadCount
      });
    }

    // Sort by last message time
    conversations.sort((a, b) => 
      new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
    );

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations',
      error: error.message
    });
  }
};

// @desc    Get messages in a conversation
// @route   GET /api/messages/:userId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    console.log('=== GET MESSAGES ===');
    console.log('Current user ID:', req.user._id);
    console.log('Other user ID:', userId);

    const conversationId = Message.generateConversationId(req.user._id, userId);
    console.log('Conversation ID:', conversationId);

    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('senderId receiverId', 'name profilePic');

    console.log('Found messages:', messages.length);
    if (messages.length > 0) {
      console.log('First message _id:', messages[0]._id);
      console.log('First message _id type:', typeof messages[0]._id);
      console.log('Sample message structure:', {
        _id: messages[0]._id,
        text: messages[0].text,
        senderId: messages[0].senderId?._id,
        receiverId: messages[0].receiverId?._id
      });
    }

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiverId: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: Date.now()
      }
    );

    const total = await Message.countDocuments({ conversationId });

    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/:userId/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const conversationId = Message.generateConversationId(req.user._id, userId);

    await Message.updateMany(
      {
        conversationId,
        receiverId: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: Date.now()
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read',
      error: error.message
    });
  }
};

// @desc    Update a message
// @route   PUT /api/messages/:id
// @access  Private
exports.updateMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const messageId = req.params.id;

    console.log('=== UPDATE MESSAGE REQUEST ===');
    console.log('Message ID:', messageId);
    console.log('Message ID type:', typeof messageId);
    console.log('Message ID length:', messageId.length);
    console.log('User ID:', req.user._id);
    console.log('New text:', text);
    console.log('Request headers:', req.headers);

    if (!text || text.trim().length === 0) {
      console.log('Error: Text is empty');
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    // Ensure messageId is a valid MongoDB ObjectId
    if (messageId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(messageId)) {
      console.log('Error: Invalid message ID format');
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID format'
      });
    }

    // Validate ObjectId using mongoose
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      console.log('Error: Invalid MongoDB ObjectId');
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID'
      });
    }

    console.log('Attempting to find message by ID...');
    const message = await Message.findById(messageId);

    console.log('Database query completed');
    console.log('Message found:', !!message);
    if (message) {
      console.log('Message details:', {
        id: message._id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        text: message.text
      });
    } else {
      console.log('NO MESSAGE FOUND IN DATABASE');
      console.log('Searching for any messages from this user...');
      const userMessages = await Message.find({ senderId: req.user._id }).limit(5);
      console.log('User has', userMessages.length, 'messages in database');
      if (userMessages.length > 0) {
        console.log('Sample message IDs:', userMessages.map(m => m._id.toString()));
      }
    }

    if (!message) {
      console.log('Error: Message not found with ID:', messageId);
      return res.status(404).json({
        success: false,
        message: 'Message not found. It may have been deleted.'
      });
    }

    if (message.senderId.toString() !== req.user._id.toString()) {
      console.log('Error: User not authorized. Message sender:', message.senderId.toString(), 'Current user:', req.user._id.toString());
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this message'
      });
    }

    message.text = text.trim();
    message.isEdited = true;
    await message.save();

    await message.populate('senderId receiverId', 'name profilePic');

    console.log('=== MESSAGE UPDATED SUCCESSFULLY ===');
    console.log('Updated message ID:', message._id);
    console.log('Updated message text:', message.text);
    
    res.json({
      success: true,
      message: message,
      data: {
        _id: message._id,
        text: message.text,
        isEdited: message.isEdited,
        senderId: message.senderId,
        receiverId: message.receiverId,
        conversationId: message.conversationId,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt
      }
    });
  } catch (error) {
    console.error('=== UPDATE MESSAGE ERROR ===');
    console.error('Error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while updating message',
      error: error.message
    });
  }
};


// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    await Message.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting message',
      error: error.message
    });
  }
};

// @desc    Delete entire conversation
// @route   DELETE /api/messages/conversation/:userId
// @access  Private
exports.deleteConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const conversationId = Message.generateConversationId(req.user._id, userId);

    const result = await Message.deleteMany({ conversationId });

    res.json({
      success: true,
      message: `Conversation deleted successfully. ${result.deletedCount} messages removed.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting conversation',
      error: error.message
    });
  }
};

// @desc    Send bulk message to all users (Admin only)
// @route   POST /api/messages/bulk/send-all
// @access  Private/Admin
exports.sendBulkMessage = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can send bulk messages'
      });
    }

    const { text, recipientType, recipientIds } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    if (!recipientType || !['all', 'providers', 'customers', 'individual'].includes(recipientType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipient type'
      });
    }

    let targetUsers;

    // Determine which users to send to
    if (recipientType === 'all') {
      // Get all users except the admin
      targetUsers = await User.find({ _id: { $ne: req.user._id } }).select('_id');
    } else if (recipientType === 'providers') {
      // Get all providers
      targetUsers = await User.find({ role: 'provider', _id: { $ne: req.user._id } }).select('_id');
    } else if (recipientType === 'customers') {
      // Get all customers
      targetUsers = await User.find({ role: 'customer', _id: { $ne: req.user._id } }).select('_id');
    } else if (recipientType === 'individual') {
      // Get specified individual users
      if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Recipient IDs required for individual messages'
        });
      }
      targetUsers = await User.find({ _id: { $in: recipientIds } }).select('_id');
    }

    if (targetUsers.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No users to send message to',
        messagesSent: 0
      });
    }

    // Create messages for each user
    const messages = targetUsers.map(user => ({
      conversationId: Message.generateConversationId(req.user._id, user._id),
      senderId: req.user._id,
      receiverId: user._id,
      text,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await Message.insertMany(messages);

    // Emit socket events to all users
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');

    targetUsers.forEach(user => {
      const recipientSocketId = onlineUsers.get(user._id.toString());
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receive_bulk_message', {
          senderId: req.user._id,
          senderName: req.user.name,
          text: text,
          createdAt: new Date(),
          isBulk: true
        });
      }
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      messagesSent: targetUsers.length,
      recipientType
    });
  } catch (error) {
    console.error('Bulk message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending bulk message',
      error: error.message
    });
  }
};
