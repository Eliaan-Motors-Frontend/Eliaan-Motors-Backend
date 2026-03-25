const Car = require('../models/Car');
const cloudinary = require('../config/cloudinary');

console.log('Car model loaded:', typeof Car, Car ? '✅' : '❌');
console.log('Car.find exists:', typeof Car.find);

// @desc    Get all cars
// @route   GET /api/cars
// @access  Public
const getCars = async (req, res) => {
  try {
    const { 
      location, 
      brand, 
      minPrice, 
      maxPrice, 
      transmission, 
      seats, 
      fuelType, 
      sort,
      page = 1,
      limit = 10
    } = req.query;
    
    let query = { available: true };
    
    // Filters
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }
    if (transmission) {
      query.transmission = transmission;
    }
    if (seats) {
      query.seats = parseInt(seats);
    }
    if (fuelType) {
      query.fuelType = fuelType;
    }
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = parseInt(minPrice);
      if (maxPrice) query.pricePerDay.$lte = parseInt(maxPrice);
    }
    
    // Sorting
    let sortOption = {};
    if (sort === 'price_asc') {
      sortOption = { pricePerDay: 1 };
    } else if (sort === 'price_desc') {
      sortOption = { pricePerDay: -1 };
    } else if (sort === 'rating') {
      sortOption = { rating: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const cars = await Car.find(query)
      .populate('vendorId', 'fullName businessName businessAddress')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);
    
    const total = await Car.countDocuments(query);
    
    res.json({
      cars,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single car
// @route   GET /api/cars/:id
// @access  Public
const getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id)
      .populate('vendorId', 'fullName businessName businessAddress phone email');
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    res.json(car);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a car
// @route   POST /api/cars
// @access  Private/Vendor
const createCar = async (req, res) => {
  try {
    const carData = {
      ...req.body,
      vendorId: req.user._id
    };
    
    const car = await Car.create(carData);
    res.status(201).json(car);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a car
// @route   PUT /api/cars/:id
// @access  Private/Vendor
const updateCar = async (req, res) => {
  try {
    let car = await Car.findById(req.params.id);
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    // Check if user owns the car
    if (car.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this car' });
    }
    
    car = await Car.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    res.json(car);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a car
// @route   DELETE /api/cars/:id
// @access  Private/Vendor
const deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    // Check if user owns the car
    if (car.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this car' });
    }
    
    // Delete images from Cloudinary if they exist
    if (car.images && car.images.length > 0) {
      for (const imageUrl of car.images) {
        const publicId = imageUrl.split('/').pop().split('.')[0];
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (cloudError) {
          console.error('Cloudinary delete error:', cloudError);
        }
      }
    }
    
    await car.deleteOne();
    res.json({ message: 'Car removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get vendor cars
// @route   GET /api/cars/vendor/my-cars
// @access  Private/Vendor
const getVendorCars = async (req, res) => {
  try {
    const cars = await Car.find({ vendorId: req.user._id })
      .sort('-createdAt');
    res.json(cars);
  } catch (error) {
    console.error('Error in getVendorCars:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get featured cars
// @route   GET /api/cars/featured
// @access  Public
const getFeaturedCars = async (req, res) => {
  try {
    const cars = await Car.find({ featured: true, available: true })
      .limit(6)
      .populate('vendorId', 'fullName businessName');
    res.json(cars);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Advanced search cars with multiple filters
// @route   POST /api/cars/search
// @access  Public
const advancedSearch = async (req, res) => {
  try {
    const {
      query,
      brand,
      minPrice,
      maxPrice,
      transmission,
      seats,
      fuelType,
      location,
      year,
      sortBy = 'newest',
      page = 1,
      limit = 12
    } = req.body;
    
    let searchQuery = { available: true };
    
    // Text search (name, brand, description)
    if (query && query.trim()) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }
    
    // Brand filter (multiple brands)
    if (brand && brand.length > 0) {
      searchQuery.brand = { $in: brand };
    }
    
    // Location filter
    if (location && location.trim()) {
      searchQuery.location = { $regex: location, $options: 'i' };
    }
    
    // Transmission filter
    if (transmission) {
      searchQuery.transmission = transmission;
    }
    
    // Seats filter
    if (seats) {
      searchQuery.seats = parseInt(seats);
    }
    
    // Fuel type filter
    if (fuelType) {
      searchQuery.fuelType = fuelType;
    }
    
    // Year filter
    if (year) {
      searchQuery.year = parseInt(year);
    }
    
    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      searchQuery.pricePerDay = {};
      if (minPrice !== undefined && minPrice !== null) {
        searchQuery.pricePerDay.$gte = parseInt(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== null) {
        searchQuery.pricePerDay.$lte = parseInt(maxPrice);
      }
    }
    
    // Sorting options
    let sortOption = {};
    switch (sortBy) {
      case 'price_asc':
        sortOption = { pricePerDay: 1 };
        break;
      case 'price_desc':
        sortOption = { pricePerDay: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Execute search
    const cars = await Car.find(searchQuery)
      .populate('vendorId', 'fullName businessName businessAddress')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);
    
    const total = await Car.countDocuments(searchQuery);
    
    // Get filter options for UI (distinct values)
    const [brands, transmissions, fuelTypes, seatsOptions, years, priceStats] = await Promise.all([
      Car.distinct('brand', { available: true }),
      Car.distinct('transmission', { available: true }),
      Car.distinct('fuelType', { available: true }),
      Car.distinct('seats', { available: true }).sort(),
      Car.distinct('year', { available: true }).sort(),
      Car.aggregate([
        { $match: { available: true } },
        {
          $group: {
            _id: null,
            minPrice: { $min: '$pricePerDay' },
            maxPrice: { $max: '$pricePerDay' }
          }
        }
      ])
    ]);
    
    res.json({
      success: true,
      cars,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      },
      filters: {
        brands: brands.sort(),
        transmissions,
        fuelTypes,
        seats: seatsOptions,
        years: years.sort((a, b) => b - a),
        priceRange: {
          min: priceStats[0]?.minPrice || 0,
          max: priceStats[0]?.maxPrice || 500
        }
      }
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Search failed', 
      error: error.message 
    });
  }
};

// Export all functions
module.exports = { 
  getCars, 
  getCarById, 
  createCar, 
  updateCar, 
  deleteCar, 
  getVendorCars,
  getFeaturedCars,
  advancedSearch
};