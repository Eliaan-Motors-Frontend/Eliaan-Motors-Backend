const express = require('express');
const router = express.Router();
const {
  createReview,
  getCarReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  markHelpful,
  vendorRespond
} = require('../controllers/reviewController');
const { protect, vendor } = require('../middleware/authMiddleware');

// Public routes
router.get('/car/:carId', getCarReviews);

// Protected routes
router.use(protect);

// User routes
router.post('/', createReview);
router.get('/my-reviews', getUserReviews);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.put('/:id/helpful', markHelpful);

// Vendor routes
router.post('/:id/respond', vendor, vendorRespond);

module.exports = router;