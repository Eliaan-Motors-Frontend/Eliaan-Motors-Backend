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

// User routes
router.post('/', createBooking);
router.get('/my-bookings', getUserBookings);
router.get('/stats', getBookingStats);
router.put('/:id/cancel', cancelBooking);
router.get('/:id', getBookingById);

// Vendor only routes
router.get('/vendor-bookings', vendor, getVendorBookings);
router.put('/:id/status', vendor, updateBookingStatus);

module.exports = router;