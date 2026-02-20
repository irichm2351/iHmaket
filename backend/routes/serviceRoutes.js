const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const serviceController = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/auth');
const { requireActiveSubscription } = require('../middleware/subscription');
const { validate } = require('../middleware/validator');
const upload = require('../middleware/upload');

// Validation rules
const serviceValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required')
];

// Public routes
router.get('/', serviceController.getServices);
router.get('/featured', serviceController.getFeaturedServices);
router.get('/provider/:providerId', serviceController.getServicesByProvider);
router.get('/:id', serviceController.getServiceById);

// Protected routes (providers only)
router.post(
  '/',
  protect,
  authorize('provider', 'admin'),
  requireActiveSubscription,
  upload.array('images', 5),
  serviceController.createService
);

router.put(
  '/:id',
  protect,
  authorize('provider', 'admin'),
  requireActiveSubscription,
  upload.array('images', 5),
  serviceController.updateService
);

router.delete(
  '/:id',
  protect,
  authorize('provider', 'admin'),
  requireActiveSubscription,
  serviceController.deleteService
);

module.exports = router;
