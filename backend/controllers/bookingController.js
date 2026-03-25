const Booking = require('../models/Booking');
const Car = require('../models/Car');

// @desc    Create a booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const { 
      carId, 
      pickupDate, 
      returnDate, 
      pickupTime, 
      returnTime,
      pickupLocation,
      returnLocation,
      specialRequests,
      paymentMethod
    } = req.body;
    
    // Get car details
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    // Check if car is available
    if (!car.available) {
      return res.status(400).json({ message: 'Car is not available for booking' });
    }
    
    // Check for overlapping bookings
    const existingBookings = await Booking.find({
      carId,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          pickupDate: { $lte: new Date(returnDate) },
          returnDate: { $gte: new Date(pickupDate) }
        }
      ]
    });
    
    if (existingBookings.length > 0) {
      return res.status(400).json({ message: 'Car is already booked for these dates' });
    }
    
    // Calculate total amount
    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    const days = Math.ceil((returnD - pickup) / (1000 * 60 * 60 * 24));
    const totalAmount = days * car.pricePerDay;
    
    // Create booking
    const booking = await Booking.create({
      userId: req.user._id,
      carId,
      vendorId: car.vendorId,
      pickupDate,
      returnDate,
      pickupTime,
      returnTime,
      pickupLocation: pickupLocation || car.location,
      returnLocation: returnLocation || car.location,
      totalAmount,
      specialRequests,
      paymentMethod
    });
    
    // Populate booking details
    const populatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'fullName email phone')
      .populate('carId', 'name brand mainImage location')
      .populate('vendorId', 'fullName businessName');
    
    res.status(201).json(populatedBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('carId', 'name brand mainImage location pricePerDay')
      .populate('vendorId', 'fullName businessName businessAddress')
      .sort('-createdAt');
    
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get vendor bookings
// @route   GET /api/bookings/vendor-bookings
// @access  Private/Vendor
const getVendorBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ vendorId: req.user._id })
      .populate('userId', 'fullName email phone')
      .populate('carId', 'name brand mainImage location pricePerDay')
      .sort('-createdAt');
    
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'fullName email phone')
      .populate('carId', 'name brand mainImage location pricePerDay transmission seats fuelType')
      .populate('vendorId', 'fullName businessName businessAddress phone');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user owns the booking or is the vendor
    if (booking.userId._id.toString() !== req.user._id.toString() && 
        booking.vendorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private/Vendor
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Only vendor can update booking status
    if (booking.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }
    
    booking.status = status;
    
    if (status === 'cancelled') {
      booking.cancelledAt = new Date();
    } else if (status === 'completed') {
      booking.completedAt = new Date();
    }
    
    await booking.save();
    
    const updatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'fullName email phone')
      .populate('carId', 'name brand mainImage');
    
    res.json(updatedBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel booking (by user)
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Only the booking owner can cancel
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }
    
    // Check if cancellation is allowed (e.g., at least 24 hours before pickup)
    const pickupDateTime = new Date(booking.pickupDate);
    const now = new Date();
    const hoursUntilPickup = (pickupDateTime - now) / (1000 * 60 * 60);
    
    if (hoursUntilPickup < 24) {
      return res.status(400).json({ message: 'Cancellations must be made at least 24 hours before pickup' });
    }
    
    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();
    
    await booking.save();
    
    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get booking stats for dashboard
// @route   GET /api/bookings/stats
// @access  Private
const getBookingStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments({ userId: req.user._id });
    const activeBookings = await Booking.countDocuments({ 
      userId: req.user._id,
      status: 'confirmed',
      returnDate: { $gte: new Date() }
    });
    const completedBookings = await Booking.countDocuments({ 
      userId: req.user._id,
      status: 'completed'
    });
    const cancelledBookings = await Booking.countDocuments({ 
      userId: req.user._id,
      status: 'cancelled'
    });
    
    res.json({
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getVendorBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getBookingStats
};