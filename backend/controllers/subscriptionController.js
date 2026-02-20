const axios = require('axios');
const crypto = require('crypto');
const User = require('../models/User');
const SubscriptionSetting = require('../models/SubscriptionSetting');
const { isSubscriptionActive } = require('../middleware/subscription');

const getSubscriptionSetting = async () => {
  let setting = await SubscriptionSetting.findOne();
  if (!setting) {
    setting = await SubscriptionSetting.create({});
  }
  return setting;
};

const buildPaystackHeaders = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json'
});

const getExpiryDate = (months = 1) => {
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + months);
  return expiry;
};

// @desc    Get public subscription settings
// @route   GET /api/subscription/settings
// @access  Public
exports.getSubscriptionSettings = async (req, res) => {
  try {
    const setting = await getSubscriptionSetting();
    res.json({
      success: true,
      settings: {
        enabled: setting.enabled,
        amount: setting.amount,
        currency: setting.currency,
        interval: setting.interval
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription settings'
    });
  }
};

// @desc    Get subscription status for current user
// @route   GET /api/subscription/status
// @access  Private
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const setting = await getSubscriptionSetting();
    const user = await User.findById(req.user._id).select('-password');

    const active = user.role === 'provider' ? isSubscriptionActive(user) : true;

    res.json({
      success: true,
      status: {
        enabled: setting.enabled,
        amount: setting.amount,
        currency: setting.currency,
        interval: setting.interval,
        isProvider: user.role === 'provider',
        isActive: active,
        expiresAt: user.subscriptionExpiresAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription status'
    });
  }
};

// @desc    Initialize subscription payment
// @route   POST /api/subscription/initialize
// @access  Private (Provider)
exports.initializeSubscription = async (req, res) => {
  try {
    const setting = await getSubscriptionSetting();

    if (!setting.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Subscription is currently disabled'
      });
    }

    if (req.user.role !== 'provider') {
      return res.status(403).json({
        success: false,
        message: 'Only providers can subscribe'
      });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Paystack is not configured'
      });
    }

    const reference = `sub_${req.user._id}_${Date.now()}`;
    const amountInKobo = Math.round(Number(setting.amount) * 100);

    const payload = {
      email: req.user.email,
      amount: amountInKobo,
      currency: setting.currency,
      reference,
      metadata: {
        userId: req.user._id.toString(),
        type: 'provider_subscription'
      }
    };

    if (process.env.PAYSTACK_CALLBACK_URL) {
      payload.callback_url = process.env.PAYSTACK_CALLBACK_URL;
    }

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      payload,
      { headers: buildPaystackHeaders() }
    );

    res.json({
      success: true,
      authorizationUrl: response.data?.data?.authorization_url,
      reference,
      amount: setting.amount,
      currency: setting.currency,
      interval: setting.interval
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error initializing subscription',
      error: error.response?.data?.message || error.message
    });
  }
};

// @desc    Verify subscription payment
// @route   GET /api/subscription/verify/:reference
// @access  Private (Provider)
exports.verifySubscription = async (req, res) => {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Paystack is not configured'
      });
    }

    const { reference } = req.params;
    const verifyResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: buildPaystackHeaders() }
    );

    const data = verifyResponse.data?.data;
    if (!data || data.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    const setting = await getSubscriptionSetting();
    const user = await User.findById(req.user._id);

    user.subscriptionStatus = 'active';
    user.subscriptionExpiresAt = getExpiryDate(1);
    user.subscriptionReference = reference;
    user.subscriptionProvider = 'paystack';
    user.subscriptionAmount = Number(setting.amount);
    user.subscriptionCurrency = setting.currency;
    user.subscriptionUpdatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'Subscription activated',
      subscription: {
        status: user.subscriptionStatus,
        expiresAt: user.subscriptionExpiresAt,
        amount: user.subscriptionAmount,
        currency: user.subscriptionCurrency
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying subscription',
      error: error.response?.data?.message || error.message
    });
  }
};

// @desc    Paystack webhook handler
// @route   POST /api/subscription/webhook
// @access  Public
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];

    if (!process.env.PAYSTACK_SECRET_KEY || !signature) {
      return res.status(400).json({ success: false });
    }

    const payloadBuffer = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body));

    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(payloadBuffer)
      .digest('hex');

    if (hash !== signature) {
      return res.status(400).json({ success: false });
    }

    const event = Buffer.isBuffer(req.body)
      ? JSON.parse(req.body.toString('utf8'))
      : req.body;

    if (event?.event === 'charge.success') {
      const metadata = event.data?.metadata || {};
      const userId = metadata.userId;

      if (userId) {
        const setting = await getSubscriptionSetting();
        const user = await User.findById(userId);

        if (user) {
          user.subscriptionStatus = 'active';
          user.subscriptionExpiresAt = getExpiryDate(1);
          user.subscriptionReference = event.data?.reference || '';
          user.subscriptionProvider = 'paystack';
          user.subscriptionAmount = Number(setting.amount);
          user.subscriptionCurrency = setting.currency;
          user.subscriptionUpdatedAt = new Date();
          await user.save();
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

// @desc    Health check for Paystack configuration
// @route   GET /api/subscription/health
// @access  Public
exports.getSubscriptionHealth = async (req, res) => {
  try {
    const setting = await getSubscriptionSetting();
    const paystackConfigured = !!process.env.PAYSTACK_SECRET_KEY;

    res.json({
      success: true,
      health: {
        subscriptionEnabled: setting.enabled,
        paystackConfigured,
        environment: process.env.NODE_ENV || 'development',
        amount: setting.amount,
        currency: setting.currency,
        paystackMode: process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test',
        webhookConfigured: !!process.env.PAYSTACK_CALLBACK_URL,
        callbackUrl: process.env.PAYSTACK_CALLBACK_URL || 'not set'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking subscription health'
    });
  }
};
