const Review = require('../models/Review');
const Service = require('../models/Service');
const User = require('../models/User');
const Booking = require('../models/Booking');

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private (Customers with completed bookings)
exports.createReview = async (req, res) => {
  try {
    const { bookingId, serviceId, providerId, rating, comment } = req.body;

    // If bookingId is provided, validate the booking
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      if (booking.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Can only review completed bookings'
        });
      }

      if (booking.customerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to review this booking'
        });
      }

      // Check if review already exists for this booking
      const existingReview = await Review.findOne({ bookingId });
      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this booking'
        });
      }
    }

    // Validate provider exists
    const provider = await User.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Create review
    const review = await Review.create({
      customerId: req.user._id,
      providerId,
      serviceId,
      bookingId,
      rating,
      comment
    });

    // Update service rating
    await updateServiceRating(serviceId);

    // Update provider rating
    await updateProviderRating(providerId);

    await review.populate('customerId', 'name profilePic');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
};

// @desc    Get reviews for a service
// @route   GET /api/reviews/service/:serviceId
// @access  Public
exports.getServiceReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const reviews = await Review.find({ serviceId: req.params.serviceId })
      .populate('customerId', 'name profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments({ serviceId: req.params.serviceId });

    res.json({
      success: true,
      reviews,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// @desc    Get reviews for a provider
// @route   GET /api/reviews/provider/:providerId
// @access  Public
exports.getProviderReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const reviews = await Review.find({ providerId: req.params.providerId })
      .populate('customerId', 'name profilePic')
      .populate('serviceId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments({ providerId: req.params.providerId });

    res.json({
      success: true,
      reviews,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// @desc    Provider responds to review
// @route   PUT /api/reviews/:id/respond
// @access  Private (Provider)
exports.respondToReview = async (req, res) => {
  try {
    const { text } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this review'
      });
    }

    review.providerResponse = {
      text,
      respondedAt: Date.now()
    };

    await review.save();

    res.json({
      success: true,
      message: 'Response added successfully',
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error responding to review',
      error: error.message
    });
  }
};

// Helper function to update service rating
async function updateServiceRating(serviceId) {
  const reviews = await Review.find({ serviceId });
  
  if (reviews.length > 0) {
    const avgRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    
    await Service.findByIdAndUpdate(serviceId, {
      rating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length
    });
  }
}

// Helper function to update provider rating
async function updateProviderRating(providerId) {
  const reviews = await Review.find({ providerId });
  
  if (reviews.length > 0) {
    const avgRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    
    await User.findByIdAndUpdate(providerId, {
      rating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length
    });
  }
}
