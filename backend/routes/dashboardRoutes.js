const express = require('express');
const router = express.Router();
const {
  getUserDashboardStats,
  getVendorDashboardStats,
  getVendorEarningsChart
} = require('../controllers/dashboardController');
const { protect, vendor } = require('../middleware/authMiddleware');

// User dashboard stats (protected)
router.get('/user', protect, getUserDashboardStats);

// Vendor dashboard stats (protected + vendor only)
router.get('/vendor', protect, vendor, getVendorDashboardStats);
router.get('/vendor/earnings-chart', protect, vendor, getVendorEarningsChart);

module.exports = router;