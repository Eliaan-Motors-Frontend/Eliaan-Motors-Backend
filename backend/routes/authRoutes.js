const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
  // googleAuth,        // TEMPORARILY COMMENTED OUT
  // googleAuthCallback // TEMPORARILY COMMENTED OUT
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Google OAuth routes - TEMPORARILY COMMENTED OUT
// router.get('/google', googleAuth);
// router.get('/google/callback', googleAuthCallback);

// Private routes
router.get('/me', protect, getMe);

module.exports = router;