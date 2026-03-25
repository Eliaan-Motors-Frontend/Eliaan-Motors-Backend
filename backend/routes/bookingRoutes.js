const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getVendorBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getBookingStats
} = require('../controllers/bookingController');
const { protect, vendor } = require('../middleware/authMiddleware');

// Protected routes (require authentication)
router.use(protect);

// User routes - ORDER MATTERS! Put specific routes BEFORE generic ones
router.post('/', createBooking);
router.get('/my-bookings', getUserBookings);
router.get('/stats', getBookingStats);
router.put('/:id/cancel', cancelBooking);

// Vendor only routes - Put these BEFORE the generic :id route
router.get('/vendor-bookings', vendor, getVendorBookings);
router.put('/:id/status', vendor, updateBookingStatus);

// Generic routes - These should come LAST
router.get('/:id', getBookingById);

module.exports = router;