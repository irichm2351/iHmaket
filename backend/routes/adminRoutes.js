const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/adminAuth');

// All routes require admin authentication
router.use(protectAdmin);

// Dashboard stats
router.get('/stats', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserDetail);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/status', adminController.toggleUserStatus);
router.put('/users/:id/restrict', adminController.toggleUserRestriction);
router.delete('/users/:id', adminController.deleteUser);

// KYC management
router.get('/kyc', adminController.getKycSubmissions);
router.get('/kyc/:id', adminController.getKycSubmission);
router.put('/kyc/:id/approve', adminController.approveKyc);
router.put('/kyc/:id/reject', adminController.rejectKyc);

module.exports = router;
