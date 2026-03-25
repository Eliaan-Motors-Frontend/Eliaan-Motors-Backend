const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure one user can't favorite the same car twice
favoriteSchema.index({ userId: 1, carId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);