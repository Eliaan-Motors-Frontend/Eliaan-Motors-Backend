const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  uploadProfileImage,
  getVendorProfile,
  updateVendorProfile,
  deleteAccount
} = require('../controllers/userController');
const { protect, vendor } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes require authentication
router.use(protect);

// Profile routes
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.put('/change-password', changePassword);
router.post('/upload-profile-image', upload.single('image'), uploadProfileImage);
router.delete('/account', deleteAccount);

// Vendor specific routes
router.get('/vendor/profile', vendor, getVendorProfile);
router.put('/vendor/profile', vendor, updateVendorProfile);

module.exports = router;