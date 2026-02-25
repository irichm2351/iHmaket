const SupportTicket = require('../models/SupportTicket');
const SupportMessage = require('../models/SupportMessage');
const User = require('../models/User');

// @desc    Create support ticket message from user
// @route   POST /api/support/messages
// @access  Private
exports.createSupportMessage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    const trimmedText = text.trim();

    // Find or create support ticket
    let ticket = await SupportTicket.findOne({
      userId: req.user._id,
      status: { $in: ['open', 'assigned'] }
    }).sort({ createdAt: -1 });

    if (!ticket) {
      ticket = await SupportTicket.create({
        userId: req.user._id,
        status: 'open',
        lastMessage: trimmedText,
        lastMessageAt: new Date()
      });
      console.log(`✅ New support ticket created: ${ticket._id} by user ${req.user.name}`);
    } else {
      ticket.lastMessage = trimmedText;
      ticket.lastMessageAt = new Date();
      await ticket.save();
      console.log(`📝 Updated existing ticket: ${ticket._id}`);
    }

    // Determine who to send message to
    let receiverId = ticket.assignedAdminId; // If assigned to admin, send to that admin
    
    if (!receiverId) {
      // If no assigned admin, send to broadcast to all online admins
      // For now, we'll store with null receiverId and broadcast
      receiverId = null;
    }

    // Create support message
    const message = await SupportMessage.create({
      ticketId: ticket._id,
      senderId: req.user._id,
      senderRole: 'user',
      receiverId: receiverId,
      text: trimmedText
    });

    await message.populate('senderId', 'name profilePic');

    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');

    // If assigned to specific admin, send directly to that admin
    if (ticket.assignedAdminId) {
      const adminSocketId = onlineUsers.get(ticket.assignedAdminId.toString());
      if (adminSocketId) {
        io.to(adminSocketId).emit('support_message', {
          _id: message._id,
          ticketId: message.ticketId,
          senderId: message.senderId._id,
          senderName: message.senderId.name,
          senderProfilePic: message.senderId.profilePic,
          senderRole: message.senderRole,
          text: message.text,
          createdAt: message.createdAt
        });
      }
    } else {
      // If not assigned, notify all online admins about the new message
      const admins = await User.find({ role: 'admin', isActive: true }).select('_id name profilePic');
      console.log(`👥 Found ${admins.length} active admin(s):`, admins.map(a => a.name).join(', '));
      console.log(`🌐 Total online users: ${onlineUsers.size}`);
      console.log(`📋 Online users map:`, Array.from(onlineUsers.keys()));

      let notifiedCount = 0;
      admins.forEach((admin) => {
        const adminSocketId = onlineUsers.get(admin._id.toString());
        console.log(`🔍 Checking admin ${admin.name} (${admin._id.toString()}): socketId=${adminSocketId}`);
        
        if (adminSocketId) {
          console.log(`✉️  Broadcasting to admin ${admin.name} on socket ${adminSocketId}`);
          // First send support_request notification so admin sees the alert
          io.to(adminSocketId).emit('support_request', {
            ticketId: ticket._id,
            user: {
              _id: req.user._id,
              name: req.user.name,
              profilePic: req.user.profilePic
            },
            lastMessage: trimmedText,
            createdAt: ticket.createdAt
          });
          notifiedCount++;
        }
      });
      console.log(`✅ Notified ${notifiedCount} online admin(s) about support request from ${req.user.name}`);
    }

    return res.status(201).json({
      success: true,
      ticket,
      message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating support message',
      error: error.message
    });
  }
};

// @desc    Get open support tickets (admin only)
// @route   GET /api/support/tickets/open
// @access  Private (Admin)
exports.getOpenTickets = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const tickets = await SupportTicket.find({ status: 'open' })
      .populate('userId', 'name profilePic email')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      tickets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching support tickets',
      error: error.message
    });
  }
};

// @desc    Claim a support ticket (admin only)
// @route   POST /api/support/tickets/:ticketId/claim
// @access  Private (Admin)
exports.claimTicket = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { ticketId } = req.params;

    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    if (ticket.status !== 'open') {
      return res.status(409).json({
        success: false,
        message: 'Support ticket already assigned'
      });
    }

    ticket.status = 'assigned';
    ticket.assignedAdminId = req.user._id;
    await ticket.save();

    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const userSocketId = onlineUsers.get(ticket.userId.toString());

    if (userSocketId) {
      io.to(userSocketId).emit('support_assigned', {
        ticketId: ticket._id,
        userId: ticket.userId,
        admin: {
          _id: req.user._id,
          name: req.user.name,
          profilePic: req.user.profilePic
        }
      });
    }

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate('userId', 'name profilePic email');

    res.json({
      success: true,
      ticket: populatedTicket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error claiming support ticket',
      error: error.message
    });
  }
};

// @desc    Get ticket details
// @route   GET /api/support/tickets/:ticketId
// @access  Private
exports.getTicketDetails = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await SupportTicket.findById(ticketId)
      .populate('userId', 'name profilePic email')
      .populate('assignedAdminId', 'name profilePic email');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Check authorization - user or assigned admin can view
    if (ticket.userId.toString() !== req.user._id.toString() && 
        (!ticket.assignedAdminId || ticket.assignedAdminId._id.toString() !== req.user._id.toString()) &&
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this ticket'
      });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ticket details',
      error: error.message
    });
  }
};

// @desc    Update ticket status
// @route   PUT /api/support/tickets/:ticketId/status
// @access  Private (Admin)
exports.updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!['open', 'assigned', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: open, assigned, or closed'
      });
    }

    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Only assigned admin or other admin can update status
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update ticket status'
      });
    }

    // If changing to 'assigned', set the admin if not already assigned
    if (status === 'assigned' && !ticket.assignedAdminId) {
      ticket.assignedAdminId = req.user._id;
    }

    ticket.status = status;
    await ticket.save();

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate('userId', 'name profilePic email')
      .populate('assignedAdminId', 'name profilePic email');

    res.json({
      success: true,
      ticket: populatedTicket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating ticket status',
      error: error.message
    });
  }
};

// @desc    Get support messages for a ticket
// @route   GET /api/support/messages/:ticketId
// @access  Private
exports.getSupportMessages = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // User can only view their own tickets, admins can view any
    if (ticket.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this ticket'
      });
    }

    const messages = await SupportMessage.find({ ticketId })
      .populate('senderId', 'name profilePic')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching support messages',
      error: error.message
    });
  }
};

// @desc    Admin accepts and responds to support request
// @route   POST /api/support/tickets/:ticketId/accept
// @access  Private (Admin)
exports.acceptSupportRequest = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { text } = req.body; // Optional reply message

    if (req.user.role !== 'admin') {
      console.log(`❌ Non-admin user attempted to accept support request: ${req.user.name}`);
      return res.status(403).json({
        success: false,
        message: 'Only admins can accept support requests'
      });
    }

    console.log(`🔍 Admin ${req.user.name} attempting to accept ticket: ${ticketId}`);

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      console.log(`❌ Ticket not found: ${ticketId}`);
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Assign ticket to this admin
    ticket.status = 'assigned';
    ticket.assignedAdminId = req.user._id;
    await ticket.save();

    console.log(`✅ Admin ${req.user.name} assigned to ticket ${ticketId}`);

    // If there's a reply message, create it
    let message = null;
    if (text && text.trim()) {
      message = await SupportMessage.create({
        ticketId: ticket._id,
        senderId: req.user._id,
        senderRole: 'admin',
        receiverId: ticket.userId,
        text: text.trim()
      });
      await message.populate('senderId', 'name profilePic');
      console.log(`📝 Greeting message created: ${message._id}`);
    }

    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');

    // Notify the user that admin accepted
    const userSocketId = onlineUsers.get(ticket.userId.toString());
    console.log(`🔍 Looking for user socket: userId=${ticket.userId.toString()}, socketId=${userSocketId}`);
    
    if (userSocketId) {
      console.log(`📤 Emitting support_assigned to user on socket ${userSocketId}`);
      io.to(userSocketId).emit('support_assigned', {
        ticketId: ticket._id,
        admin: {
          _id: req.user._id,
          name: req.user.name,
          profilePic: req.user.profilePic
        }
      });

      // If there's a message, also send that
      if (message) {
        console.log(`📤 Emitting greeting message to user`);
        io.to(userSocketId).emit('support_message', {
          _id: message._id,
          ticketId: message.ticketId,
          senderId: message.senderId._id,
          senderName: message.senderId.name,
          senderProfilePic: message.senderId.profilePic,
          senderRole: message.senderRole,
          text: message.text,
          createdAt: message.createdAt
        });
      }
    } else {
      console.log(`⚠️  User ${ticket.userId} not online`);
    }

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate('userId', 'name profilePic')
      .populate('assignedAdminId', 'name profilePic');

    res.json({
      success: true,
      ticket: populatedTicket,
      message
    });
  } catch (error) {
    console.error(`❌ Error accepting support request:`, error);
    res.status(500).json({
      success: false,
      message: 'Error accepting support request',
      error: error.message
    });
  }
};

// @desc    Send support message (from admin or user)
// @route   POST /api/support/tickets/:ticketId/message
// @access  Private
exports.sendSupportMessage = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Determine sender role and receiver
    let senderRole = 'user';
    let receiverId = ticket.assignedAdminId;

    if (req.user.role === 'admin') {
      senderRole = 'admin';
      receiverId = ticket.userId;
    } else {
      // User can only send if they own the ticket
      if (ticket.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }
    }

    const message = await SupportMessage.create({
      ticketId: ticket._id,
      senderId: req.user._id,
      senderRole,
      receiverId,
      text: text.trim()
    });

    await message.populate('senderId', 'name profilePic');

    // Update ticket's last message
    ticket.lastMessage = text.trim();
    ticket.lastMessageAt = new Date();
    await ticket.save();

    // Send via socket to recipient
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const recipientSocketId = onlineUsers.get(receiverId.toString());

    if (recipientSocketId) {
      io.to(recipientSocketId).emit('support_message', {
        _id: message._id,
        ticketId: message.ticketId,
        senderId: message.senderId._id,
        senderName: message.senderId.name,
        senderProfilePic: message.senderId.profilePic,
        senderRole: message.senderRole,
        text: message.text,
        createdAt: message.createdAt
      });
    }

    res.json({
      success: true,
      message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending support message',
      error: error.message
    });
  }
};
