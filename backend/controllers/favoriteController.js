const Favorite = require('../models/Favorite');
const Car = require('../models/Car');

// @desc    Add car to favorites
// @route   POST /api/favorites
// @access  Private
const addToFavorites = async (req, res) => {
  try {
    const { carId } = req.body;
    
    // Check if car exists
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      userId: req.user._id,
      carId
    });
    
    if (existingFavorite) {
      return res.status(400).json({ message: 'Car already in favorites' });
    }
    
    const favorite = await Favorite.create({
      userId: req.user._id,
      carId
    });
    
    res.status(201).json({
      message: 'Car added to favorites',
      favorite
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove car from favorites
// @route   DELETE /api/favorites/:carId
// @access  Private
const removeFromFavorites = async (req, res) => {
  try {
    const { carId } = req.params;
    
    const favorite = await Favorite.findOneAndDelete({
      userId: req.user._id,
      carId
    });
    
    if (!favorite) {
      return res.status(404).json({ message: 'Car not found in favorites' });
    }
    
    res.json({ message: 'Car removed from favorites' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user favorites
// @route   GET /api/favorites
// @access  Private
const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id })
      .populate('carId')
      .sort('-createdAt');
    
    res.json(favorites);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Check if car is favorited
// @route   GET /api/favorites/check/:carId
// @access  Private
const checkFavorite = async (req, res) => {
  try {
    const { carId } = req.params;
    
    const favorite = await Favorite.findOne({
      userId: req.user._id,
      carId
    });
    
    res.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  checkFavorite
};