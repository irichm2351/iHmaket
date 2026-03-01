const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a service title'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: 2000
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: [
      'Plumbing',
      'Electrical',
      'Cleaning',
      'Carpentry',
      'Painting',
      'Beauty & Makeup',
      'Catering',
      'Photography',
      'Tutoring',
      'IT & Tech Support',
      'Home Repair',
      'Gardening',
      'Moving & Delivery',
      'Event Planning',
      'Health & Fitness',
      'Other'
    ]
  },
  price: {
    amount: {
      type: Number,
      required: [true, 'Please provide a price']
    },
    currency: {
      type: String,
      default: 'NGN'
    },
    negotiable: {
      type: Boolean,
      default: false
    }
  },
  images: [{
    url: String,
    publicId: String
  }],
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    address: String,
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    lga: {
      type: String,
      default: ''
    },
    country: {
      type: String,
      default: 'Nigeria'
    }
  },
  availability: {
    type: String,
    enum: ['Available', 'Busy', 'Unavailable'],
    default: 'Available'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster searches
serviceSchema.index({ title: 'text', description: 'text' });
serviceSchema.index({ category: 1, 'location.city': 1 });
serviceSchema.index({ rating: -1, createdAt: -1 });

module.exports = mongoose.model('Service', serviceSchema);
