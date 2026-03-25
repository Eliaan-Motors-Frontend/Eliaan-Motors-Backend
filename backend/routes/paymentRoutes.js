const express = require('express');
const router = express.Router();
const {
  initializePayment,
  initializeMobileMoney,
  initializeCardPayment,
  verifyPayment,
  getPaymentHistory,
  getPaymentDetails,
  getVendorEarnings,
  getPaymentMethods,
  paymentWebhook
} = require('../controllers/paymentController');
const { protect, vendor } = require('../middleware/authMiddleware');

// Public webhook (no authentication needed)
router.post('/webhook', paymentWebhook);
router.get('/methods', getPaymentMethods);

// Protected routes
router.use(protect);

// Payment operations
router.post('/initialize', initializePayment);
router.post('/card', initializeCardPayment);
router.post('/mobile-money', initializeMobileMoney);
router.get('/verify/:reference', verifyPayment);
router.get('/history', getPaymentHistory);
router.get('/earnings', vendor, getVendorEarnings);
router.get('/:id', getPaymentDetails);

module.exports = router;