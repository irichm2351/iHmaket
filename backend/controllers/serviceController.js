const Service = require('../models/Service');
const User = require('../models/User');
const Booking = require('../models/Booking');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper to build absolute image URLs
const getServerBaseUrl = () => {
  const port = process.env.PORT || 5000;
  return process.env.SERVER_URL || `http://localhost:${port}`;
};

const buildImageUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('http')) return url;
  const normalized = url.startsWith('/') ? url : `/${url}`;
  return `${getServerBaseUrl()}${normalized}`;
};

const normalizeServiceImages = (service) => {
  const data = service?.toObject ? service.toObject() : { ...service };
  data.images = (data.images || []).map((img) => {
    if (!img) return img;
    if (typeof img === 'string') {
      return { url: buildImageUrl(img) };
    }
    return { ...img, url: buildImageUrl(img.url) };
  });
  return data;
};

// @desc    Create a new service
// @route   POST /api/services
// @access  Private (Providers only)
exports.createService = async (req, res) => {
  try {
    // Check if user is a verified provider
    if (req.user.role !== 'provider') {
      return res.status(403).json({
        success: false,
        message: 'Only service providers can create services'
      });
    }

    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your KYC must be verified before you can post services'
      });
    }

    const { title, description, category, price, location, availability } = req.body;

    const parseMaybeJson = (value, fieldName) => {
      if (value === undefined || value === null) return value;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (err) {
          const error = new Error(`Invalid JSON for ${fieldName}`);
          error.status = 400;
          throw error;
        }
      }
      return value;
    };

    const parsedPrice = parseMaybeJson(price, 'price');
    const parsedLocation = parseMaybeJson(location, 'location');

    // Handle image uploads
    let images = [];
    const hasCloudinaryConfig = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    if (req.files && req.files.length > 0) {
      if (hasCloudinaryConfig) {
        // Upload to Cloudinary
        for (const file of req.files) {
          try {
            const result = await new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { 
                  folder: 'servicehub/services',
                  timeout: 60000
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              
              const stream = fs.createReadStream(file.path);
              stream.on('error', reject);
              stream.pipe(uploadStream);
            });
            images.push({
              url: result.secure_url,
              publicId: result.public_id
            });
            
            // Delete local file after uploading to Cloudinary
            try {
              fs.unlinkSync(file.path);
            } catch (err) {
              console.error('Error deleting local file:', err);
            }
          } catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError);
            throw uploadError;
          }
        }
      } else {
        // Fallback: Use the already saved files from disk
        for (const file of req.files) {
          const fileUrl = `/uploads/${path.basename(file.path)}`;
          images.push({
            url: fileUrl,
            publicId: null,
            filename: file.filename
          });
        }
      }
    }

    const service = await Service.create({
      title,
      description,
      category,
      price: parsedPrice,
      location: parsedLocation,
      availability,
      images,
      providerId: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(error.status || 500).json({
      success: false,
      message: 'Error creating service',
      error: error.message
    });
  }
};

// @desc    Get all services with filters
// @route   GET /api/services
// @access  Public
exports.getServices = async (req, res) => {
  try {
    const { 
      search, 
      category, 
      city, 
      state,
      minPrice, 
      maxPrice, 
      rating,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    // Build query
    let query = { isActive: true };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Location filters
    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }
    if (state) {
      query['location.state'] = new RegExp(state, 'i');
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query['price.amount'] = {};
      if (minPrice) query['price.amount'].$gte = Number(minPrice);
      if (maxPrice) query['price.amount'].$lte = Number(maxPrice);
    }

    // Rating filter
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    // Sort options
    let sortOption = { createdAt: -1 }; // Default: newest first
    if (sort === 'price_low') sortOption = { 'price.amount': 1 };
    if (sort === 'price_high') sortOption = { 'price.amount': -1 };
    if (sort === 'rating') sortOption = { rating: -1 };
    if (sort === 'popular') sortOption = { views: -1 };

    // Pagination
    const skip = (page - 1) * limit;

    const services = await Service.find(query)
      .populate({
        path: 'providerId',
        select: 'name profilePic rating location isActive isRestricted',
        match: { isActive: true, isRestricted: false }
      })
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Filter out services where provider is inactive or restricted
    const filteredServices = services.filter(service => service.providerId !== null);

    const total = await Service.countDocuments(query);
    const filteredTotal = filteredServices.length;

    const servicesWithImages = filteredServices.map((service) => normalizeServiceImages(service));

    res.json({
      success: true,
      services: servicesWithImages,
      pagination: {
        total: filteredTotal,
        page: Number(page),
        pages: Math.ceil(filteredTotal / limit),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching services',
      error: error.message
    });
  }
};

// @desc    Get single service by ID
// @route   GET /api/services/:id
// @access  Public
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('providerId', 'name profilePic rating totalReviews bio location phone email isActive isRestricted');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check if provider is active and not restricted
    if (!service.providerId || !service.providerId.isActive || service.providerId.isRestricted) {
      return res.status(404).json({
        success: false,
        message: 'Service not available'
      });
    }

    // Increment views
    service.views += 1;
    await service.save();

    const serviceWithImages = normalizeServiceImages(service);

    res.json({
      success: true,
      service: serviceWithImages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching service',
      error: error.message
    });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private (Provider - own services only)
exports.updateService = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check ownership
    if (service.providerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this service'
      });
    }

    const { title, description, category, price, location, availability, imagesToRemove } = req.body;

    const parseMaybeJson = (value, fieldName) => {
      if (value === undefined || value === null) return value;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (err) {
          const error = new Error(`Invalid JSON for ${fieldName}`);
          error.status = 400;
          throw error;
        }
      }
      return value;
    };

    // Update basic fields
    if (title) service.title = title;
    if (description) service.description = description;
    if (category) service.category = category;
    if (price !== undefined && price !== null) service.price = parseMaybeJson(price, 'price');
    if (location) service.location = parseMaybeJson(location, 'location');
    if (availability) service.availability = availability;

    // Handle image removal
    if (imagesToRemove) {
      const imagesToRemoveArray = typeof imagesToRemove === 'string' 
        ? JSON.parse(imagesToRemove) 
        : imagesToRemove;
      
      for (const imageIndex of imagesToRemoveArray) {
        const image = service.images[imageIndex];
        if (image && image.publicId) {
          await cloudinary.uploader.destroy(image.publicId);
        }
      }
      
      service.images = service.images.filter((_, index) => 
        !imagesToRemoveArray.includes(index)
      );
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const hasCloudinaryConfig = Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      );

      if (hasCloudinaryConfig) {
        // Upload to Cloudinary
        for (const file of req.files) {
          try {
            const result = await new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { 
                  folder: 'servicehub/services',
                  timeout: 60000
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              
              const stream = fs.createReadStream(file.path);
              stream.on('error', reject);
              stream.pipe(uploadStream);
            });
            
            service.images.push({
              url: result.secure_url,
              publicId: result.public_id
            });
            
            // Delete local file after uploading to Cloudinary
            try {
              fs.unlinkSync(file.path);
            } catch (err) {
              console.error('Error deleting local file:', err);
            }
          } catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError);
            throw uploadError;
          }
        }
      } else {
        // Fallback: Use the already saved files from disk
        for (const file of req.files) {
          const fileUrl = `/uploads/${path.basename(file.path)}`;
          service.images.push({
            url: fileUrl,
            publicId: null,
            filename: file.filename
          });
        }
      }
    }

    await service.save();

    res.json({
      success: true,
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(error.status || 500).json({
      success: false,
      message: 'Error updating service',
      error: error.message
    });
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private (Provider - own services only)
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check ownership
    if (service.providerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this service'
      });
    }

    // 1. Remove service from all users' saved/favorite services
    await User.updateMany(
      { savedServices: service._id },
      { $pull: { savedServices: service._id } }
    );

    // 2. Cancel all pending bookings for this service
    await Booking.updateMany(
      { 
        serviceId: service._id,
        status: 'pending'
      },
      { 
        status: 'cancelled',
        cancellationReason: 'Service has been deleted by provider',
        cancelledBy: req.user._id
      }
    );

    // 3. Cancel all accepted bookings that haven't been completed
    await Booking.updateMany(
      { 
        serviceId: service._id,
        status: 'accepted'
      },
      { 
        status: 'cancelled',
        cancellationReason: 'Service has been deleted by provider',
        cancelledBy: req.user._id
      }
    );

    // 4. Delete images from Cloudinary
    for (const image of service.images) {
      if (image.publicId) {
        await cloudinary.uploader.destroy(image.publicId);
      }
    }

    // 5. Delete the service
    await Service.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Service deleted successfully. All related bookings have been cancelled and removed from user favorites.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting service',
      error: error.message
    });
  }
};

// @desc    Get services by provider
// @route   GET /api/services/provider/:providerId
// @access  Public
exports.getServicesByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    
    // Get provider to check status
    const provider = await User.findById(providerId).select('isActive isRestricted');
    
    // If viewing another provider's services (customer view), check if provider is active
    if (req.user?._id.toString() !== providerId && (!provider || !provider.isActive || provider.isRestricted)) {
      return res.json({
        success: true,
        services: [] // Return empty list if provider is inactive/restricted
      });
    }

    const services = await Service.find({
      providerId: providerId,
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching provider services',
      error: error.message
    });
  }
};

// @desc    Get featured services
// @route   GET /api/services/featured
// @access  Public
exports.getFeaturedServices = async (req, res) => {
  try {
    // First try to get featured services
    let services = await Service.find({ 
      isFeatured: true, 
      isActive: true 
    })
      .populate({
        path: 'providerId',
        select: 'name profilePic rating isActive isRestricted',
        match: { isActive: true, isRestricted: false }
      })
      .sort({ rating: -1 })
      .limit(8);

    // Filter out services where provider is inactive or restricted
    services = services.filter(service => service.providerId !== null);

    // If no featured services, show top-rated/most popular services
    if (services.length === 0) {
      services = await Service.find({ 
        isActive: true 
      })
        .populate({
          path: 'providerId',
          select: 'name profilePic rating isActive isRestricted',
          match: { isActive: true, isRestricted: false }
        })
        .sort({ rating: -1, views: -1, createdAt: -1 })
        .limit(8);

      // Filter out services where provider is inactive or restricted
      services = services.filter(service => service.providerId !== null);
    }

    const servicesWithImages = services.map((service) => normalizeServiceImages(service));

    res.json({
      success: true,
      services: servicesWithImages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching featured services',
      error: error.message
    });
  }
};
