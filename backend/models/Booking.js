const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please add a user ID']
  },
  carId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: [true, 'Please add a car ID']
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please add a vendor ID']
  },
  pickupDate: {
    type: Date,
    required: [true, 'Please add pickup date']
  },
  returnDate: {
    type: Date,
    required: [true, 'Please add return date']
  },
  pickupTime: {
    type: String,
    required: [true, 'Please add pickup time'],
    default: '09:00 AM'
  },
  returnTime: {
    type: String,
    required: [true, 'Please add return time'],
    default: '05:00 PM'
  },
  pickupLocation: {
    type: String,
    required: [true, 'Please add pickup location']
  },
  returnLocation: {
    type: String,
    required: [true, 'Please add return location']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Please add total amount'],
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'mobile_money', 'bank_transfer'],
    default: 'credit_card'
  },
  specialRequests: {
    type: String,
    maxlength: 500
  },
  driverDetails: {
    name: String,
    license: String
  },
  cancellationReason: {
    type: String
  },
  cancelledAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate number of days between pickup and return
bookingSchema.virtual('duration').get(function() {
  const diffTime = Math.abs(this.returnDate - this.pickupDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Check if booking is active
bookingSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'confirmed' && this.pickupDate <= now && this.returnDate >= now;
});

module.exports = mongoose.model('Booking', bookingSchema);