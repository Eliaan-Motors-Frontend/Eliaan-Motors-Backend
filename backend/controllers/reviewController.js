const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Car = require('../models/Car');

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { carId, bookingId, rating, title, comment, images } = req.body;
    
    // Check if booking exists and belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Verify booking belongs to user
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to review this booking' });
    }
    
    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'You can only review completed bookings' });
    }
    
    // Check if user already reviewed this booking
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this booking' });
    }
    
    // Create review
    const review = await Review.create({
      userId: req.user._id,
      carId,
      bookingId,
      rating,
      title,
      comment,
      images,
      verified: true
    });
    
    // Update car rating
    await updateCarRating(carId);
    
    res.status(201).json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get reviews for a car
// @route   GET /api/reviews/car/:carId
// @access  Public
const getCarReviews = async (req, res) => {
  try {
    const { carId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    
    // Sort options
    let sortOption = {};
    if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'highest') {
      sortOption = { rating: -1 };
    } else if (sort === 'lowest') {
      sortOption = { rating: 1 };
    } else if (sort === 'helpful') {
      sortOption = { helpful: -1 };
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const reviews = await Review.find({ carId })
      .populate('userId', 'fullName profileImage')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);
    
    const total = await Review.countDocuments({ carId });
    
    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { carId: new mongoose.Types.ObjectId(carId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      reviews,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      ratingDistribution
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id })
      .populate('carId', 'name brand mainImage')
      .populate('bookingId', 'pickupDate returnDate')
      .sort('-createdAt');
    
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = async (req, res) => {
  try {
    let review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user owns the review
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }
    
    // Update fields
    review.rating = req.body.rating || review.rating;
    review.title = req.body.title || review.title;
    review.comment = req.body.comment || review.comment;
    review.images = req.body.images || review.images;
    review.updatedAt = Date.now();
    
    await review.save();
    
    // Update car rating
    await updateCarRating(review.carId);
    
    res.json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user owns the review
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }
    
    await review.deleteOne();
    
    // Update car rating
    await updateCarRating(review.carId);
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark review as helpful
// @route   PUT /api/reviews/:id/helpful
// @access  Private
const markHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    review.helpful += 1;
    await review.save();
    
    res.json({ message: 'Marked as helpful', helpful: review.helpful });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Vendor response to review
// @route   POST /api/reviews/:id/respond
// @access  Private/Vendor
const vendorRespond = async (req, res) => {
  try {
    const { response } = req.body;
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Get car to verify vendor owns it
    const car = await Car.findById(review.carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    // Check if vendor owns the car
    if (car.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this review' });
    }
    
    review.vendorResponse = {
      text: response,
      date: new Date()
    };
    
    await review.save();
    
    res.json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to update car rating
const updateCarRating = async (carId) => {
  const stats = await Review.aggregate([
    { $match: { carId: new mongoose.Types.ObjectId(carId) } },
    { $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  
  if (stats.length > 0) {
    await Car.findByIdAndUpdate(carId, {
      rating: Math.round(stats[0].averageRating * 10) / 10,
      reviews: stats[0].totalReviews
    });
  }
};

module.exports = {
  createReview,
  getCarReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  markHelpful,
  vendorRespond
};