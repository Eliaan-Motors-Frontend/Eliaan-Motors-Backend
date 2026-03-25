const mongoose = require('mongoose');

const recentlyViewedSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  carId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  viewedAt: {
    type: Date,
    default: Date.now
  }
});

// Limit to 10 recently viewed cars per user
recentlyViewedSchema.index({ userId: 1, viewedAt: -1 });

module.exports = mongoose.model('RecentlyViewed', recentlyViewedSchema);