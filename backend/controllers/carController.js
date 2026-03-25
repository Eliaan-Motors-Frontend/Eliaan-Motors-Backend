const Car = require('../models/Car');
const cloudinary = require('../config/cloudinary');

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
    
    // Delete images from Cloudinary
    if (car.images && car.images.length > 0) {
      for (const imageUrl of car.images) {
        const publicId = imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
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
    console.error(error);
    res.status(500).json({ message: 'Server error' });
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

module.exports = { 
  getCars, 
  getCarById, 
  createCar, 
  updateCar, 
  deleteCar, 
  getVendorCars,
  getFeaturedCars
};