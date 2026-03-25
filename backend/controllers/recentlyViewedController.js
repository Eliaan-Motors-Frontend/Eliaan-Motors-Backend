const RecentlyViewed = require('../models/RecentlyViewed');
const Car = require('../models/Car');

// @desc    Add car to recently viewed
// @route   POST /api/recently-viewed
// @access  Private
const addToRecentlyViewed = async (req, res) => {
  try {
    const { carId } = req.body;
    
    // Check if car exists
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    // Remove existing entry if exists
    await RecentlyViewed.findOneAndDelete({
      userId: req.user._id,
      carId
    });
    
    // Add new entry
    const recentlyViewed = await RecentlyViewed.create({
      userId: req.user._id,
      carId
    });
    
    // Keep only last 10 entries
    const count = await RecentlyViewed.countDocuments({ userId: req.user._id });
    if (count > 10) {
      const oldest = await RecentlyViewed.find({ userId: req.user._id })
        .sort('viewedAt')
        .limit(count - 10);
      await RecentlyViewed.deleteMany({ _id: { $in: oldest.map(o => o._id) } });
    }
    
    res.status(201).json(recentlyViewed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get recently viewed cars
// @route   GET /api/recently-viewed
// @access  Private
const getRecentlyViewed = async (req, res) => {
  try {
    const recentlyViewed = await RecentlyViewed.find({ userId: req.user._id })
      .populate('carId')
      .sort('-viewedAt')
      .limit(10);
    
    res.json(recentlyViewed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Clear recently viewed
// @route   DELETE /api/recently-viewed
// @access  Private
const clearRecentlyViewed = async (req, res) => {
  try {
    await RecentlyViewed.deleteMany({ userId: req.user._id });
    res.json({ message: 'Recently viewed cleared' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  addToRecentlyViewed,
  getRecentlyViewed,
  clearRecentlyViewed
};