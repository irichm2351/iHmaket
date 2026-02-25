const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportTicket',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  senderRole: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 5000
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
supportMessageSchema.index({ ticketId: 1, createdAt: -1 });
supportMessageSchema.index({ senderId: 1, createdAt: -1 });
supportMessageSchema.index({ receiverId: 1, createdAt: -1 });

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
