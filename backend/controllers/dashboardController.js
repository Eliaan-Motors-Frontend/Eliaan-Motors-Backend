const Booking = require('../models/Booking');
const Car = require('../models/Car');
const Payment = require('../models/Payment');
const Review = require('../models/Review');

// @desc    Get user dashboard statistics
// @route   GET /api/dashboard/user
// @access  Private
const getUserDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    
    // Get all user bookings
    const allBookings = await Booking.find({ userId });
    
    // Total bookings
    const totalBookings = allBookings.length;
    
    // Active rentals (confirmed and dates include today)
    const activeRentals = await Booking.countDocuments({
      userId,
      status: 'confirmed',
      pickupDate: { $lte: now },
      returnDate: { $gte: now }
    });
    
    // Total spent (from paid bookings)
    const paidBookings = await Booking.find({
      userId,
      paymentStatus: 'paid'
    });
    const totalSpent = paidBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    
    // Upcoming bookings (confirmed and pickup date in future)
    const upcomingBookings = await Booking.find({
      userId,
      status: 'confirmed',
      pickupDate: { $gt: now }
    }).populate('carId', 'name brand mainImage');
    
    // Recent bookings (last 5)
    const recentBookings = await Booking.find({ userId })
      .populate('carId', 'name brand mainImage location pricePerDay')
      .sort('-createdAt')
      .limit(5);
    
    // Booking status breakdown
    const statusBreakdown = {
      pending: await Booking.countDocuments({ userId, status: 'pending' }),
      confirmed: await Booking.countDocuments({ userId, status: 'confirmed' }),
      completed: await Booking.countDocuments({ userId, status: 'completed' }),
      cancelled: await Booking.countDocuments({ userId, status: 'cancelled' })
    };
    
    // Monthly spending (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    
    const monthlySpending = await Booking.aggregate([
      {
        $match: {
          userId,
          paymentStatus: 'paid',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.json({
      success: true,
      stats: {
        totalBookings,
        activeRentals,
        totalSpent,
        upcomingBookings: upcomingBookings.length,
        statusBreakdown
      },
      upcomingBookings,
      recentBookings,
      monthlySpending,
      currency: 'GHS'
    });
  } catch (error) {
    console.error('Get user dashboard stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get vendor dashboard statistics
// @route   GET /api/dashboard/vendor
// @access  Private/Vendor
const getVendorDashboardStats = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const now = new Date();
    
    // Get vendor's cars
    const cars = await Car.find({ vendorId });
    const totalCars = cars.length;
    const availableCars = cars.filter(car => car.available).length;
    const rentedCars = cars.filter(car => !car.available).length;
    
    // Get all bookings for vendor's cars
    const allBookings = await Booking.find({ vendorId });
    const totalBookings = allBookings.length;
    
    // Active bookings (confirmed and current)
    const activeBookings = await Booking.countDocuments({
      vendorId,
      status: 'confirmed',
      pickupDate: { $lte: now },
      returnDate: { $gte: now }
    });
    
    // Upcoming bookings
    const upcomingBookings = await Booking.find({
      vendorId,
      status: 'confirmed',
      pickupDate: { $gt: now }
    }).populate('userId', 'fullName email phone')
      .populate('carId', 'name brand mainImage');
    
    // Total earnings from paid bookings
    const paidBookings = await Booking.find({
      vendorId,
      paymentStatus: 'paid'
    });
    const totalEarnings = paidBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    
    // Average rating from cars
    const totalRating = cars.reduce((sum, car) => sum + (car.rating || 0), 0);
    const averageRating = cars.length > 0 ? (totalRating / cars.length).toFixed(1) : 0;
    
    // Monthly earnings (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    
    const monthlyEarnings = await Booking.aggregate([
      {
        $match: {
          vendorId,
          paymentStatus: 'paid',
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Recent bookings (last 10)
    const recentBookings = await Booking.find({ vendorId })
      .populate('userId', 'fullName email phone')
      .populate('carId', 'name brand mainImage')
      .sort('-createdAt')
      .limit(10);
    
    // Booking status breakdown
    const statusBreakdown = {
      pending: await Booking.countDocuments({ vendorId, status: 'pending' }),
      confirmed: await Booking.countDocuments({ vendorId, status: 'confirmed' }),
      completed: await Booking.countDocuments({ vendorId, status: 'completed' }),
      cancelled: await Booking.countDocuments({ vendorId, status: 'cancelled' })
    };
    
    // Car status breakdown
    const carStatus = {
      available: availableCars,
      rented: rentedCars,
      maintenance: cars.filter(car => !car.available && car.status === 'maintenance').length,
      total: totalCars
    };
    
    // Popular cars (most booked)
    const popularCars = await Booking.aggregate([
      { $match: { vendorId, status: 'completed' } },
      {
        $group: {
          _id: '$carId',
          bookingCount: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { bookingCount: -1 } },
      { $limit: 5 }
    ]);
    
    // Populate car details for popular cars
    const popularCarsWithDetails = await Promise.all(
      popularCars.map(async (item) => {
        const car = await Car.findById(item._id).select('name brand mainImage');
        return {
          ...item,
          car
        };
      })
    );
    
    res.json({
      success: true,
      stats: {
        totalCars,
        availableCars,
        rentedCars,
        totalBookings,
        activeBookings,
        totalEarnings,
        averageRating,
        upcomingBookings: upcomingBookings.length,
        statusBreakdown,
        carStatus
      },
      upcomingBookings,
      recentBookings,
      monthlyEarnings,
      popularCars: popularCarsWithDetails,
      currency: 'GHS'
    });
  } catch (error) {
    console.error('Get vendor dashboard stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get monthly earnings chart data (vendor)
// @route   GET /api/dashboard/vendor/earnings-chart
// @access  Private/Vendor
const getVendorEarningsChart = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { months = 12 } = req.query;
    
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - (parseInt(months) - 1));
    
    const earnings = await Booking.aggregate([
      {
        $match: {
          vendorId,
          paymentStatus: 'paid',
          createdAt: { $gte: monthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Format for chart
    const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedData = earnings.map(item => ({
      month: monthsNames[item._id.month - 1],
      year: item._id.year,
      total: item.total,
      bookings: item.count
    }));
    
    res.json({
      success: true,
      data: formattedData,
      currency: 'GHS'
    });
  } catch (error) {
    console.error('Get vendor earnings chart error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getUserDashboardStats,
  getVendorDashboardStats,
  getVendorEarningsChart
};