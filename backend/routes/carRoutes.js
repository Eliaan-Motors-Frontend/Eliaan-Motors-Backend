const express = require('express');
const router = express.Router();
const {
  getCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  getVendorCars,
  getFeaturedCars,
  advancedSearch  // Import the new function
} = require('../controllers/carController');
const { protect, vendor } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getCars);
router.get('/featured', getFeaturedCars);
router.get('/:id', getCarById);
router.post('/search', advancedSearch);  // Add advanced search route

// Vendor only routes (protected)
router.get('/vendor/my-cars', protect, vendor, getVendorCars);
router.post('/', protect, vendor, createCar);
router.put('/:id', protect, vendor, updateCar);
router.delete('/:id', protect, vendor, deleteCar);

module.exports = router;