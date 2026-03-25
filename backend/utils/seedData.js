const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Car = require('../models/Car');
const Booking = require('../models/Booking');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await User.deleteMany({});
    await Car.deleteMany({});
    await Booking.deleteMany({});
    
    console.log('Database cleared');
    
    // Create test vendor
    const vendor = await User.create({
      fullName: 'Test Vendor',
      email: 'vendor@test.com',
      phone: '+233241234567',
      password: '123456',
      role: 'vendor',
      businessName: 'Test Motors',
      businessAddress: 'Test Address, Accra'
    });
    
    // Create test user
    const user = await User.create({
      fullName: 'Test User',
      email: 'user@test.com',
      phone: '+233245678901',
      password: '123456',
      role: 'user'
    });
    
    // Create test cars
    const cars = await Car.create([
      {
        vendorId: vendor._id,
        name: 'Mercedes Benz C-Class',
        brand: 'Mercedes',
        model: 'C-Class',
        year: 2023,
        pricePerDay: 250,
        location: 'Airport Residential, Accra',
        transmission: 'Automatic',
        seats: 5,
        fuelType: 'Petrol',
        description: 'Luxury sedan with premium features',
        mainImage: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=600',
        images: ['https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=600'],
        features: ['Leather Seats', 'Apple CarPlay'],
        featured: true,
        available: true
      },
      {
        vendorId: vendor._id,
        name: 'BMW X5',
        brand: 'BMW',
        model: 'X5',
        year: 2023,
        pricePerDay: 350,
        location: 'Cantonments, Accra',
        transmission: 'Automatic',
        seats: 7,
        fuelType: 'Diesel',
        description: 'Luxury SUV with spacious interior',
        mainImage: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600',
        images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600'],
        features: ['Leather Seats', 'Panoramic Roof'],
        featured: true,
        available: true
      }
    ]);
    
    console.log('Seed data created successfully');
    console.log('Vendor ID:', vendor._id);
    console.log('User ID:', user._id);
    console.log('Car IDs:', cars.map(c => c._id));
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();