const express = require('express');
const router = express.Router();
const {
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  checkFavorite
} = require('../controllers/favoriteController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.post('/', addToFavorites);
router.get('/', getFavorites);
router.get('/check/:carId', checkFavorite);
router.delete('/:carId', removeFromFavorites);

module.exports = router;