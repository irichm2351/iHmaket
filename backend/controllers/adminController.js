const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const SubscriptionSetting = require('../models/SubscriptionSetting');
const Message = require('../models/Message');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 10 } = req.query;

    let query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (status === 'restricted') query.isRestricted = true;

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user's services count
    const servicesCount = await Service.countDocuments({ providerId: user._id });

    // Get user's bookings count
    const bookingsCount = await Booking.countDocuments({
      $or: [
        { customerId: user._id },
        { providerId: user._id }
      ]
    });

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        servicesCount,
        bookingsCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['customer', 'provider', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);

    // If changing provider back to customer, reset KYC so they have to resubmit
    if (user.role === 'provider' && role === 'customer') {
      user.kycStatus = 'none';
      user.isVerified = false;
      user.kycData = undefined;
      user.kycSubmittedAt = undefined;
      user.kycRejectionReason = '';
    }

    user.role = role;
    await user.save();

    const updatedUser = await User.findById(req.params.id).select('-password');

    res.json({
      success: true,
      message: `User role updated to ${role}${role === 'customer' ? '. User must resubmit KYC to become provider again.' : ''}`,
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user role',
      error: error.message
    });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
      user: { _id: user._id, isActive: user.isActive }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling user status',
      error: error.message
    });
  }
};

// @desc    Restrict/Unrestrict user
// @route   PUT /api/admin/users/:id/restrict
// @access  Private/Admin
exports.toggleUserRestriction = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isRestricted = !user.isRestricted;
    user.restrictionReason = user.isRestricted ? reason : '';
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isRestricted ? 'restricted' : 'unrestricted'}`,
      user: {
        _id: user._id,
        isRestricted: user.isRestricted,
        restrictionReason: user.restrictionReason
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error restricting user',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
      userId: user._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProviders = await User.countDocuments({ role: 'provider' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const activeUsers = await User.countDocuments({ isActive: true });
    const restrictedUsers = await User.countDocuments({ isRestricted: true });
    const totalServices = await Service.countDocuments();
    const totalBookings = await Booking.countDocuments();

    const pendingKyc = await User.countDocuments({ kycStatus: 'pending' });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProviders,
        totalCustomers,
        activeUsers,
        restrictedUsers,
        totalServices,
        totalBookings,
        pendingKyc
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message
    });
  }
};

// @desc    Get all KYC submissions
// @route   GET /api/admin/kyc
// @access  Private/Admin
exports.getKycSubmissions = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = { kycStatus: { $ne: 'none' } };

    if (status && status !== 'all') {
      query.kycStatus = status;
    }

    const skip = (page - 1) * limit;
    const submissions = await User.find(query)
      .select('-password')
      .sort({ kycSubmittedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      submissions,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching KYC submissions',
      error: error.message
    });
  }
};

// @desc    Get single KYC submission
// @route   GET /api/admin/kyc/:id
// @access  Private/Admin
exports.getKycSubmission = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.kycStatus === 'none') {
      return res.status(404).json({ success: false, message: 'No KYC submission found' });
    }

    res.json({
      success: true,
      submission: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching KYC submission',
      error: error.message
    });
  }
};

// @desc    Approve KYC
// @route   PUT /api/admin/kyc/:id/approve
// @access  Private/Admin
exports.approveKyc = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.kycStatus !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'KYC is not pending approval' 
      });
    }

    user.kycStatus = 'verified';
    user.isVerified = true;
    user.kycRejectionReason = '';
    user.role = 'provider'; // Automatically change to provider role
    await user.save();

    res.json({
      success: true,
      message: 'KYC approved successfully',
      user: {
        _id: user._id,
        name: user.name,
        kycStatus: user.kycStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving KYC',
      error: error.message
    });
  }
};

// @desc    Reject KYC
// @route   PUT /api/admin/kyc/:id/reject
// @access  Private/Admin
exports.rejectKyc = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rejection reason is required' 
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.kycStatus !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'KYC is not pending approval' 
      });
    }

    user.kycStatus = 'rejected';
    user.isVerified = false;
    user.kycRejectionReason = reason;
    await user.save();

    res.json({
      success: true,
      message: 'KYC rejected',
      user: {
        _id: user._id,
        name: user.name,
        kycStatus: user.kycStatus,
        kycRejectionReason: user.kycRejectionReason
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting KYC',
      error: error.message
    });
  }
};

// @desc    Get subscription settings
// @route   GET /api/admin/subscription-settings
// @access  Private/Admin
exports.getSubscriptionSettings = async (req, res) => {
  try {
    let setting = await SubscriptionSetting.findOne();
    if (!setting) {
      setting = await SubscriptionSetting.create({
        updatedBy: req.user._id
      });
    }

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
      message: 'Error fetching subscription settings',
      error: error.message
    });
  }
};

// @desc    Update subscription settings
// @route   PUT /api/admin/subscription-settings
// @access  Private/Admin
exports.updateSubscriptionSettings = async (req, res) => {
  try {
    const { enabled, amount, currency, interval } = req.body;

    let setting = await SubscriptionSetting.findOne();
    if (!setting) {
      setting = await SubscriptionSetting.create({});
    }

    const wasEnabled = setting.enabled;

    if (typeof enabled === 'boolean') {
      setting.enabled = enabled;
    }
    if (amount !== undefined) {
      setting.amount = Number(amount);
    }
    if (currency) {
      setting.currency = currency;
    }
    if (interval) {
      setting.interval = interval;
    }

    setting.updatedBy = req.user._id;
    await setting.save();

    // Handle subscription enable/disable logic
    if (wasEnabled && !setting.enabled) {
      // Admin disabled subscriptions - remove subscription from all providers
      await User.updateMany(
        { role: 'provider' },
        {
          $set: {
            subscriptionStatus: 'inactive',
            subscriptionExpiresAt: null
          }
        }
      );

      const adminUser = await User.findById(req.user._id);
      const providers = await User.find({ role: 'provider', isActive: true }).select('_id');

      if (adminUser && providers.length > 0) {
        const messageText = `Important update: Provider subscriptions have been disabled. Your services are now visible to all customers. You no longer need an active subscription to display your services.`;

        const messages = providers.map((provider) => ({
          conversationId: Message.generateConversationId(adminUser._id, provider._id),
          senderId: adminUser._id,
          receiverId: provider._id,
          text: messageText
        }));

        await Message.insertMany(messages);
      }
    } else if (!wasEnabled && setting.enabled) {
      // Admin enabled subscriptions - notify all providers
      const adminUser = await User.findById(req.user._id);
      const providers = await User.find({ role: 'provider', isActive: true }).select('_id');

      if (adminUser && providers.length > 0) {
        const messageText = `Important update: Provider subscriptions are now required. Your service ads will be hidden from customers until you subscribe. Please go to the Subscription page to activate your monthly plan.`;

        const messages = providers.map((provider) => ({
          conversationId: Message.generateConversationId(adminUser._id, provider._id),
          senderId: adminUser._id,
          receiverId: provider._id,
          text: messageText
        }));

        await Message.insertMany(messages);
      }
    }

    res.json({
      success: true,
      message: 'Subscription settings updated',
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
      message: 'Error updating subscription settings',
      error: error.message
    });
  }
};
