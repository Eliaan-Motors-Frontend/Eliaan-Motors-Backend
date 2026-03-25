const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const session = require('express-session');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import configs
const connectDB = require('./backend/config/db');
const cloudinary = require('./backend/config/cloudinary');

// Import routes
const authRoutes = require('./backend/routes/authRoutes');
const carRoutes = require('./backend/routes/carRoutes');
const bookingRoutes = require('./backend/routes/bookingRoutes');
const userRoutes = require('./backend/routes/userRoutes');
const paymentRoutes = require('./backend/routes/paymentRoutes');
const reviewRoutes = require('./backend/routes/reviewRoutes');
const favoriteRoutes = require('./backend/routes/favoriteRoutes');
const recentlyViewedRoutes = require('./backend/routes/recentlyViewedRoutes');
// const adminRoutes = require('./backend/routes/adminRoutes'); // COMMENTED OUT - Use manage-users tool instead
const dashboardRoutes = require('./backend/routes/dashboardRoutes');
const contactRoutes = require('./backend/routes/contactRoutes');

// Import error middleware
const { notFound, errorHandler } = require('./backend/middleware/errorMiddleware');

// Import reminder job
const startReminderJob = require('./backend/utils/reminderJob');

// Import email service for testing
const { testEmailConfig } = require('./backend/utils/emailService');

// Connect to database
connectDB();

// Initialize express app FIRST
const app = express();

// Session middleware (required for passport)
app.use(session({
  secret: process.env.JWT_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set to true if using https
}));

// CORS Middleware - UPDATED to allow frontend URLs
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://eliaan-motors-frontend-updated.onrender.com',
    'https://eliaan-motors-frontend.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize passport AFTER app is created
app.use(passport.initialize());
app.use(passport.session());

// Initialize passport strategies (this is important!)
require('./backend/controllers/authController');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/recently-viewed', recentlyViewedRoutes);
// app.use('/api/admin', adminRoutes); // COMMENTED OUT - Use manage-users tool instead
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/contact', contactRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Eliaan Motors API is running...',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      cars: '/api/cars',
      bookings: '/api/bookings',
      users: '/api/users',
      payments: '/api/payments',
      reviews: '/api/reviews',
      favorites: '/api/favorites',
      recentlyViewed: '/api/recently-viewed',
      dashboard: '/api/dashboard',
      contact: '/api/contact'
    }
  });
});

// Test Cloudinary connection route
app.get('/api/test-cloudinary', async (req, res) => {
  try {
    const result = await cloudinary.api.ping();
    res.json({ 
      message: 'Cloudinary connected successfully!', 
      result,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Cloudinary connection failed', 
      error: error.message 
    });
  }
});

// Test Paystack connection route
app.get('/api/test-paystack', async (req, res) => {
  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        amount: 10000,
        reference: `TEST-${Date.now()}`
      })
    });
    res.json({ 
      message: 'Paystack connection successful', 
      status: response.status 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Paystack connection failed', 
      error: error.message 
    });
  }
});

// Test Email configuration route
app.get('/api/test-email', async (req, res) => {
  const isConfigured = await testEmailConfig();
  if (isConfigured) {
    res.json({ message: 'Email service configured successfully' });
  } else {
    res.status(500).json({ message: 'Email service configuration failed' });
  }
});

// 404 handler for undefined routes
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server and reminder job
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🌩️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`💳 Paystack: ${process.env.PAYSTACK_PUBLIC_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`📧 Email: ${process.env.EMAIL_USER ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🔐 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? '✅ Configured' : '❌ Not configured'}`);
  
  // Start reminder job
  startReminderJob();
  
  console.log(`\n📋 Available Endpoints:`);
  console.log(`\n🔐 AUTH:`);
  console.log(`   POST   /api/auth/register`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/auth/me`);
  console.log(`   POST   /api/auth/forgot-password`);
  console.log(`   PUT    /api/auth/reset-password/:token`);
  console.log(`   GET    /api/auth/google`);
  console.log(`   GET    /api/auth/google/callback`);
  console.log(`\n🚗 CARS:`);
  console.log(`   GET    /api/cars`);
  console.log(`   GET    /api/cars/featured`);
  console.log(`   POST   /api/cars/search (Advanced Search)`);
  console.log(`   GET    /api/cars/:id`);
  console.log(`   POST   /api/cars (vendor only)`);
  console.log(`   PUT    /api/cars/:id (vendor only)`);
  console.log(`   DELETE /api/cars/:id (vendor only)`);
  console.log(`   GET    /api/cars/vendor/my-cars (vendor only)`);
  console.log(`\n📅 BOOKINGS:`);
  console.log(`   POST   /api/bookings`);
  console.log(`   GET    /api/bookings/my-bookings`);
  console.log(`   GET    /api/bookings/vendor-bookings (vendor only)`);
  console.log(`   GET    /api/bookings/stats`);
  console.log(`   GET    /api/bookings/:id`);
  console.log(`   PUT    /api/bookings/:id/status (vendor only)`);
  console.log(`   PUT    /api/bookings/:id/cancel`);
  console.log(`\n👤 USERS:`);
  console.log(`   GET    /api/users/profile`);
  console.log(`   PUT    /api/users/profile`);
  console.log(`   PUT    /api/users/change-password`);
  console.log(`   POST   /api/users/upload-profile-image`);
  console.log(`   POST   /api/users/upload-car-image (vendor only)`);
  console.log(`   GET    /api/users/vendor/profile (vendor only)`);
  console.log(`   PUT    /api/users/vendor/profile (vendor only)`);
  console.log(`   DELETE /api/users/account`);
  console.log(`\n💰 PAYMENTS:`);
  console.log(`   GET    /api/payments/methods`);
  console.log(`   POST   /api/payments/card`);
  console.log(`   POST   /api/payments/mobile-money`);
  console.log(`   GET    /api/payments/verify/:reference`);
  console.log(`   GET    /api/payments/history`);
  console.log(`   GET    /api/payments/earnings (vendor only)`);
  console.log(`   GET    /api/payments/:id`);
  console.log(`\n⭐ REVIEWS:`);
  console.log(`   POST   /api/reviews`);
  console.log(`   GET    /api/reviews/car/:carId`);
  console.log(`   GET    /api/reviews/my-reviews`);
  console.log(`   PUT    /api/reviews/:id`);
  console.log(`   DELETE /api/reviews/:id`);
  console.log(`   PUT    /api/reviews/:id/helpful`);
  console.log(`   POST   /api/reviews/:id/respond (vendor only)`);
  console.log(`\n❤️ FAVORITES:`);
  console.log(`   POST   /api/favorites`);
  console.log(`   GET    /api/favorites`);
  console.log(`   GET    /api/favorites/check/:carId`);
  console.log(`   DELETE /api/favorites/:carId`);
  console.log(`\n👁️ RECENTLY VIEWED:`);
  console.log(`   POST   /api/recently-viewed`);
  console.log(`   GET    /api/recently-viewed`);
  console.log(`   DELETE /api/recently-viewed`);
  console.log(`\n📊 DASHBOARD:`);
  console.log(`   GET    /api/dashboard/user (User Stats)`);
  console.log(`   GET    /api/dashboard/vendor (Vendor Stats)`);
  console.log(`   GET    /api/dashboard/vendor/earnings-chart (Earnings Chart)`);
  console.log(`\n📞 CONTACT:`);
  console.log(`   POST   /api/contact`);
  console.log(`   GET    /api/contact`);
  console.log(`   GET    /api/contact/:id`);
  console.log(`   PUT    /api/contact/:id/status`);
  console.log(`   DELETE /api/contact/:id`);
  console.log(`\n🧪 TEST ENDPOINTS:`);
  console.log(`   GET    /api/test-cloudinary`);
  console.log(`   GET    /api/test-paystack`);
  console.log(`   GET    /api/test-email`);
  console.log(`\n✅ Server ready!`);
});