const SubscriptionSetting = require('../models/SubscriptionSetting');

const getSubscriptionSetting = async () => {
  let setting = await SubscriptionSetting.findOne();
  if (!setting) {
    setting = await SubscriptionSetting.create({});
  }
  return setting;
};

const isSubscriptionActive = (user) => {
  if (!user) return false;
  if (user.subscriptionStatus !== 'active') return false;
  if (!user.subscriptionExpiresAt) return false;
  return new Date(user.subscriptionExpiresAt).getTime() > Date.now();
};

const requireActiveSubscription = async (req, res, next) => {
  try {
    const setting = await getSubscriptionSetting();

    if (!setting.enabled) {
      return next();
    }

    if (req.user?.role !== 'provider') {
      return next();
    }

    if (!isSubscriptionActive(req.user)) {
      return res.status(402).json({
        success: false,
        message: 'Subscription required to access provider features',
        subscriptionRequired: true,
        subscription: {
          enabled: true,
          amount: setting.amount,
          currency: setting.currency,
          interval: setting.interval
        }
      });
    }

    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking subscription status'
    });
  }
};

module.exports = {
  getSubscriptionSetting,
  isSubscriptionActive,
  requireActiveSubscription
};
