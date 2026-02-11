const User = require('../models/User');
const Service = require('../models/Service');

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Public
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('savedServices');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Filter out deleted services (null values from populate)
    if (user.savedServices) {
      user.savedServices = user.savedServices.filter(service => service !== null);
      
      // Update user document to remove deleted service references
      const validServiceIds = user.savedServices.map(s => s._id);
      await User.findByIdAndUpdate(req.params.id, {
        savedServices: validServiceIds
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// @desc    Save/unsave a service
// @route   POST /api/users/save-service/:serviceId
// @access  Private
exports.toggleSaveService = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const serviceId = req.params.serviceId;

    const index = user.savedServices.indexOf(serviceId);

    if (index > -1) {
      // Service already saved, remove it
      user.savedServices.splice(index, 1);
      await user.save();

      return res.json({
        success: true,
        message: 'Service removed from saved',
        saved: false
      });
    } else {
      // Save the service
      user.savedServices.push(serviceId);
      await user.save();

      return res.json({
        success: true,
        message: 'Service saved successfully',
        saved: true
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling saved service',
      error: error.message
    });
  }
};

// @desc    Get saved services
// @route   GET /api/users/saved-services
// @access  Private
exports.getSavedServices = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedServices',
      populate: {
        path: 'providerId',
        select: 'name profilePic rating'
      }
    });

    // Filter out deleted services (null values from populate)
    const validServices = user.savedServices.filter(service => service !== null);
    
    // Update user document to remove deleted service references
    if (validServices.length !== user.savedServices.length) {
      const validServiceIds = validServices.map(s => s._id);
      await User.findByIdAndUpdate(req.user._id, {
        savedServices: validServiceIds
      });
    }

    res.json({
      success: true,
      services: validServices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching saved services',
      error: error.message
    });
  }
};

// @desc    Search providers
// @route   GET /api/users/providers
// @access  Public
exports.getProviders = async (req, res) => {
  try {
    const { search, location, rating, page = 1, limit = 12 } = req.query;

    let query = { role: 'provider', isActive: true };

    if (search) {
      query.name = new RegExp(search, 'i');
    }

    if (location) {
      query['location.city'] = new RegExp(location, 'i');
    }

    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    const skip = (page - 1) * limit;

    const providers = await User.find(query)
      .select('-password')
      .sort({ rating: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      providers,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching providers',
      error: error.message
    });
  }
};
