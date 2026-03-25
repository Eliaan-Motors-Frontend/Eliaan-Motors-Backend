const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please add a vendor ID']
  },
  name: {
    type: String,
    required: [true, 'Please add car name'],
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'Please add car brand'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Please add car model']
  },
  year: {
    type: Number,
    required: [true, 'Please add year'],
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  pricePerDay: {
    type: Number,
    required: [true, 'Please add price per day'],
    min: 0
  },
  originalPrice: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    required: [true, 'Please add location'],
    trim: true
  },
  coordinates: {
    lat: Number,
    lng: Number
  },
  transmission: {
    type: String,
    enum: ['Automatic', 'Manual'],
    required: true
  },
  seats: {
    type: Number,
    required: true,
    min: 1,
    max: 15
  },
  fuelType: {
    type: String,
    enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'],
    required: true
  },
  fuelConsumption: {
    type: String
  },
  description: {
    type: String,
    required: [true, 'Please add description'],
    maxlength: 2000
  },
  images: [{
    type: String,
    required: true
  }],
  mainImage: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  available: {
    type: Boolean,
    default: true
  },
  features: [{
    type: String
  }],
  insurance: {
    included: { type: Boolean, default: true },
    details: String
  },
  mileage: {
    type: String,
    default: 'Unlimited'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Car', carSchema);