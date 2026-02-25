const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assignedAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'closed'],
    default: 'open',
    index: true
  },
  lastMessage: {
    type: String,
    maxlength: 2000,
    default: ''
  },
  lastMessageAt: {
    type: Date
  }
}, {
  timestamps: true
});

supportTicketSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
