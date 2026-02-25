const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const Message = require('../models/Message');

// @desc    Create support ticket when user opens chat
// @route   POST /api/support/tickets/create
// @access  Private
exports.createSupportTicket = async (req, res) => {
  try {
    // Check if user already has an open support ticket
    let ticket = await SupportTicket.findOne({
      userId: req.user._id,
      status: { $in: ['open', 'assigned'] }
    }).sort({ createdAt: -1 });

    // If ticket already exists, return it (notify only on first creation)
    if (ticket) {
      return res.status(200).json({
        success: true,
        ticket,
        alreadyExists: true
      });
    }

    // Create new support ticket
    ticket = await SupportTicket.create({
      userId: req.user._id,
      status: 'open',
      lastMessage: 'User opened support chat',
      lastMessageAt: new Date()
    });

    // Populate the user field
    await ticket.populate('userId', 'name profilePic email');

    // Get all admins (regardless of active status)
    const admins = await User.find({ role: 'admin' }).select('_id name profilePic email');

    console.log(`[Support Ticket] Created ticket ${ticket._id} for user ${req.user.name}`);
    console.log(`[Support Ticket] Found ${admins.length} admin(s)`);
    if (admins.length > 0) {
      console.log(`[Support Ticket] Admin emails:`, admins.map(a => a.email).join(', '));
    }

    // Notify all admins via socket
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');

    console.log(`[Support Ticket] Online users map size:`, onlineUsers.size);
    console.log(`[Support Ticket] Online user IDs:`, Array.from(onlineUsers.keys()).join(', '));

    console.log(`\n[Support Ticket] 📝 Creating new support ticket`);
    console.log(`[Support Ticket] User: ${req.user.name} (${req.user._id})`);

    let notifiedCount = 0;
    admins.forEach((admin) => {
      const adminSocketId = onlineUsers.get(admin._id.toString());
      console.log(`[Support Ticket] Checking admin ${admin.name}:`, {
        adminId: admin._id.toString(),
        online: !!adminSocketId,
        socketId: adminSocketId || 'NOT_ONLINE'
      });
      
      if (adminSocketId) {
        console.log(`[Support Ticket] ✅ Emitting to admin ${admin.name}`);
        io.to(adminSocketId).emit('support_request', {
          ticketId: ticket._id,
          user: {
            _id: ticket.userId._id,
            name: ticket.userId.name,
            profilePic: ticket.userId.profilePic
          },
          lastMessage: ticket.lastMessage,
          createdAt: ticket.createdAt,
          status: ticket.status
        });
        notifiedCount++;
      } else {
        console.log(`[Support Ticket] ❌ Admin ${admin.name} NOT ONLINE`);
      }
    });

    console.log(`[Support Ticket] 📊 Notified ${notifiedCount}/${admins.length} admins\n`);

    return res.status(201).json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('[Support Ticket] Error creating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating support ticket',
      error: error.message
    });
  }
};

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

    let ticket = await SupportTicket.findOne({
      userId: req.user._id,
      status: { $in: ['open', 'assigned'] }
    }).sort({ createdAt: -1 });

    if (ticket && ticket.assignedAdminId) {
      const conversationId = Message.generateConversationId(req.user._id, ticket.assignedAdminId);
      const message = await Message.create({
        conversationId,
        senderId: req.user._id,
        receiverId: ticket.assignedAdminId,
        text: trimmedText
      });

      await message.populate('senderId receiverId', 'name profilePic');

      const io = req.app.get('io');
      const onlineUsers = req.app.get('onlineUsers');
      const recipientSocketId = onlineUsers.get(ticket.assignedAdminId.toString());

      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receive_message', {
          senderId: message.senderId,
          receiverId: message.receiverId,
          text: message.text,
          _id: message._id,
          createdAt: message.createdAt
        });
        io.to(recipientSocketId).emit('new-message', {
          senderId: message.senderId._id,
          senderName: message.senderId.name,
          text: message.text
        });
      }

      ticket.lastMessage = trimmedText;
      ticket.lastMessageAt = new Date();
      await ticket.save();

      return res.status(201).json({
        success: true,
        ticket,
        message,
        assignedAdminId: ticket.assignedAdminId
      });
    }

    if (!ticket) {
      ticket = await SupportTicket.create({
        userId: req.user._id,
        status: 'open',
        lastMessage: trimmedText,
        lastMessageAt: new Date()
      });
    } else {
      ticket.lastMessage = trimmedText;
      ticket.lastMessageAt = new Date();
      await ticket.save();
    }

    const admins = await User.find({ role: 'admin' }).select('_id name profilePic email');

    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');

    console.log(`[Support Message] Found ${admins.length} admin(s), ${onlineUsers.size} online users`);

    admins.forEach((admin) => {
      const adminSocketId = onlineUsers.get(admin._id.toString());
      if (adminSocketId) {
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
      }
    });

    return res.status(201).json({
      success: true,
      ticket
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
