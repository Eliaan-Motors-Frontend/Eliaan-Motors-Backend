const express = require('express');
const router = express.Router();
const {
  addToRecentlyViewed,
  getRecentlyViewed,
  clearRecentlyViewed
} = require('../controllers/recentlyViewedController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', addToRecentlyViewed);
router.get('/', getRecentlyViewed);
router.delete('/', clearRecentlyViewed);

module.exports = router;