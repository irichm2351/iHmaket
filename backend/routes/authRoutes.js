const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const upload = require('../middleware/upload');

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['customer', 'provider'])
    .withMessage('Invalid role')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Public routes
router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);
router.post('/google-login', authController.googleLogin);
router.post('/apple-login', authController.appleLogin);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, authController.updateProfile);
router.post(
  '/upload-profile-pic',
  protect,
  upload.single('profilePic'),
  authController.uploadProfilePic
);

// Error handler for multer errors on profile pic upload
router.use('/upload-profile-pic', (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 50MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + err.message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Upload error'
    });
  }
  next();
});
router.put('/change-password', protect, authController.changePassword);
router.post(
  '/kyc',
  protect,
  upload.fields([
    { name: 'kycImage', maxCount: 1 },
    { name: 'selfieImage', maxCount: 1 }
  ]),
  authController.submitKYC
);

module.exports = router;
