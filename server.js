const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

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

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Eliaan Motors API is running...' });
});

// Test Cloudinary connection route
app.get('/api/test-cloudinary', async (req, res) => {
  try {
    const result = await cloudinary.api.ping();
    res.json({ message: 'Cloudinary connected successfully!', result });
  } catch (error) {
    res.status(500).json({ message: 'Cloudinary connection failed', error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : null
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Cloudinary configured with cloud name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});