const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/providers', userController.getProviders);
router.get('/:id', userController.getUserById);

// Protected routes
router.get('/support/admin', protect, userController.getSupportAdmin);
router.post('/save-service/:serviceId', protect, userController.toggleSaveService);
router.get('/saved-services', protect, userController.getSavedServices);

module.exports = router;
