const mongoose = require('mongoose');

const subscriptionSettingSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: false
  },
  amount: {
    type: Number,
    default: 2000
  },
  currency: {
    type: String,
    default: 'NGN'
  },
  interval: {
    type: String,
    default: 'monthly'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SubscriptionSetting', subscriptionSettingSchema);
