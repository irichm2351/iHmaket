const Booking = require('../models/Booking');
const Service = require('../models/Service');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (Customers)
exports.createBooking = async (req, res) => {
  try {
    const { serviceId, providerId, scheduledDate, scheduledTime, location, notes, price } = req.body;

    // Check if service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const booking = await Booking.create({
      customerId: req.user._id,
      providerId,
      serviceId,
      scheduledDate,
      scheduledTime,
      location,
      notes,
      price
    });

    await booking.populate('serviceId customerId providerId', 'name profilePic title');

    // Emit socket event to the provider
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const providerSocketId = onlineUsers.get(providerId.toString());
    
    if (providerSocketId) {
      io.to(providerSocketId).emit('new-booking', {
        bookingId: booking._id,
        customerId: req.user._id,
        customerName: req.user.name,
        serviceTitle: service.title,
        scheduledDate,
        scheduledTime
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
};

// @desc    Get pending booking count for provider
// @route   GET /api/bookings/pending-count
// @access  Private
exports.getPendingCount = async (req, res) => {
  try {
    let count = 0;

    // If user is a provider, count pending bookings they received
    if (req.user.role === 'provider') {
      count = await Booking.countDocuments({
        providerId: req.user._id,
        status: 'pending'
      });
    } else {
      // If user is a customer, count pending bookings they made
      count = await Booking.countDocuments({
        customerId: req.user._id,
        status: 'pending'
      });
    }

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get pending count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending count',
      error: error.message
    });
  }
};

// @desc    Get user bookings (customer or provider)
// @route   GET /api/bookings
// @access  Private
exports.getMyBookings = async (req, res) => {
  try {
    const { status, type } = req.query;

    let query = {};

    // Determine if user is customer or provider
    if (req.user.role === 'provider') {
      // Provider: MUST specify type to view either 'received' or 'placed'
      if (type === 'placed') {
        // My Bookings: bookings where provider is the CUSTOMER (provider booked another's service)
        query.customerId = req.user._id;
        // Ensure the provider is NOT the service provider for these bookings
        query.providerId = { $ne: req.user._id };
      } else {
        // Services Offered (received): bookings where provider is the PROVIDER (customer booked provider's service)
        query.providerId = req.user._id;
        // Ensure the provider is NOT the customer for these bookings
        query.customerId = { $ne: req.user._id };
      }
    } else {
      // Customer: always see their placed bookings (services they booked)
      query.customerId = req.user._id;
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // DEBUG LOG
    console.log('========== BOOKING QUERY DEBUG ==========');
    console.log('User Role:', req.user.role);
    console.log('User ID:', req.user._id);
    console.log('Type Parameter:', type);
    console.log('Query:', JSON.stringify(query));
    console.log('=========================================');

    const bookings = await Booking.find(query)
      .populate('serviceId', 'title category images')
      .populate('customerId', 'name profilePic phone email')
      .populate('providerId', 'name profilePic phone email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('serviceId', 'title category images price')
      .populate('customerId', 'name profilePic phone email')
      .populate('providerId', 'name profilePic phone email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    if (
      booking.customerId._id.toString() !== req.user._id.toString() &&
      booking.providerId._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message
    });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private (Provider)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is the provider
    if (booking.providerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    booking.status = status;

    if (status === 'completed') {
      booking.completedAt = Date.now();
    }

    await booking.save();

    res.json({
      success: true,
      message: `Booking ${status} successfully`,
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: error.message
    });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    if (
      booking.customerId.toString() !== req.user._id.toString() &&
      booking.providerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    booking.status = 'cancelled';
    booking.cancelledBy = req.user._id;
    booking.cancellationReason = reason;

    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};
