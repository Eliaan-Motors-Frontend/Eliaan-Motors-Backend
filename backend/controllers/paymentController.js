const axios = require('axios');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Car = require('../models/Car');

// @desc    Initialize payment with Paystack
// @route   POST /api/payments/initialize
// @access  Private
const initializePayment = async (req, res) => {
  try {
    const { bookingId, email, amount, paymentMethod, mobileMoneyNumber, mobileMoneyProvider } = req.body;
    
    // Get booking details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if booking belongs to user
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Generate unique reference
    const reference = `ELIAAN-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    
    // Prepare payment data for Paystack
    let paymentData = {
      email,
      amount: amount * 100, // Convert to kobo/cents
      reference,
      callback_url: `${process.env.FRONTEND_URL}/payment/verify`,
      metadata: {
        bookingId: booking._id.toString(),
        userId: req.user._id.toString(),
        custom_fields: [
          {
            display_name: "Booking ID",
            variable_name: "booking_id",
            value: booking._id.toString()
          },
          {
            display_name: "Car",
            variable_name: "car",
            value: booking.carId
          }
        ]
      }
    };
    
    // Add mobile money details if selected
    if (paymentMethod === 'mobile_money') {
      paymentData.channel = 'mobile_money';
      paymentData.mobile_money = {
        phone: mobileMoneyNumber,
        provider: mobileMoneyProvider // 'mtn', 'vodafone', 'airteltigo'
      };
    } else {
      paymentData.channels = ['card']; // Card payments only for card method
    }
    
    // Initialize payment with Paystack
    const response = await axios.post(
      `${process.env.PAYSTACK_BASE_URL}/transaction/initialize`,
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Save payment record
    const payment = await Payment.create({
      userId: req.user._id,
      bookingId,
      amount,
      reference,
      status: 'pending',
      paymentMethod,
      mobileMoneyNumber: paymentMethod === 'mobile_money' ? mobileMoneyNumber : undefined,
      mobileMoneyProvider: paymentMethod === 'mobile_money' ? mobileMoneyProvider : undefined,
      gatewayResponse: response.data
    });
    
    res.json({
      success: true,
      authorization_url: response.data.data.authorization_url,
      reference,
      paymentId: payment._id,
      message: paymentMethod === 'mobile_money' 
        ? 'Please check your phone to complete payment' 
        : 'Redirect to payment page'
    });
  } catch (error) {
    console.error('Payment initialization error:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Payment initialization failed', 
      error: error.response?.data || error.message 
    });
  }
};

// @desc    Initialize mobile money payment directly
// @route   POST /api/payments/mobile-money
// @access  Private
const initializeMobileMoney = async (req, res) => {
  try {
    const { bookingId, email, amount, phoneNumber, provider } = req.body;
    
    // Validate provider
    const validProviders = ['mtn', 'vodafone', 'airteltigo'];
    if (!validProviders.includes(provider.toLowerCase())) {
      return res.status(400).json({ 
        message: 'Invalid mobile money provider. Choose: mtn, vodafone, or airteltigo' 
      });
    }
    
    // Get booking details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if booking belongs to user
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Generate unique reference
    const reference = `ELIAAN-MM-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    
    // Prepare mobile money payment data
    const paymentData = {
      email,
      amount: amount * 100,
      reference,
      channels: ['mobile_money'],
      mobile_money: {
        phone: phoneNumber,
        provider: provider.toLowerCase()
      },
      metadata: {
        bookingId: booking._id.toString(),
        userId: req.user._id.toString()
      }
    };
    
    // Initialize payment with Paystack
    const response = await axios.post(
      `${process.env.PAYSTACK_BASE_URL}/transaction/initialize`,
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Save payment record
    const payment = await Payment.create({
      userId: req.user._id,
      bookingId,
      amount,
      reference,
      status: 'pending',
      paymentMethod: 'mobile_money',
      mobileMoneyNumber: phoneNumber,
      mobileMoneyProvider: provider,
      gatewayResponse: response.data
    });
    
    res.json({
      success: true,
      reference,
      paymentId: payment._id,
      message: `Please check your ${provider.toUpperCase()} Mobile Money account to complete payment`,
      transactionReference: response.data.data.reference
    });
  } catch (error) {
    console.error('Mobile Money payment error:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Mobile Money payment initialization failed', 
      error: error.response?.data || error.message 
    });
  }
};

// @desc    Initialize card payment
// @route   POST /api/payments/card
// @access  Private
const initializeCardPayment = async (req, res) => {
  try {
    const { bookingId, email, amount } = req.body;
    
    // Get booking details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if booking belongs to user
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Generate unique reference
    const reference = `ELIAAN-CARD-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    
    // Prepare card payment data
    const paymentData = {
      email,
      amount: amount * 100,
      reference,
      channels: ['card'],
      metadata: {
        bookingId: booking._id.toString(),
        userId: req.user._id.toString()
      }
    };
    
    // Initialize payment with Paystack
    const response = await axios.post(
      `${process.env.PAYSTACK_BASE_URL}/transaction/initialize`,
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Save payment record
    const payment = await Payment.create({
      userId: req.user._id,
      bookingId,
      amount,
      reference,
      status: 'pending',
      paymentMethod: 'card',
      gatewayResponse: response.data
    });
    
    res.json({
      success: true,
      authorization_url: response.data.data.authorization_url,
      reference,
      paymentId: payment._id
    });
  } catch (error) {
    console.error('Card payment error:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Card payment initialization failed', 
      error: error.response?.data || error.message 
    });
  }
};

// @desc    Verify payment
// @route   GET /api/payments/verify/:reference
// @access  Public
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    
    // Verify payment with Paystack
    const response = await axios.get(
      `${process.env.PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );
    
    const paymentData = response.data.data;
    
    // Find payment record
    const payment = await Payment.findOne({ reference });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Update payment status
    payment.status = paymentData.status === 'success' ? 'success' : 'failed';
    payment.transactionId = paymentData.reference;
    payment.gatewayResponse = paymentData;
    
    if (paymentData.status === 'success') {
      payment.paidAt = new Date();
      
      // Update booking payment status
      await Booking.findByIdAndUpdate(payment.bookingId, {
        paymentStatus: 'paid',
        status: 'confirmed'
      });
    }
    
    await payment.save();
    
    res.json({
      success: paymentData.status === 'success',
      payment,
      message: paymentData.status === 'success' ? 'Payment verified successfully' : 'Payment verification failed'
    });
  } catch (error) {
    console.error('Payment verification error:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Payment verification failed', 
      error: error.response?.data || error.message 
    });
  }
};

// @desc    Get payment methods
// @route   GET /api/payments/methods
// @access  Public
const getPaymentMethods = async (req, res) => {
  res.json({
    methods: [
      {
        id: 'card',
        name: 'Card Payment',
        icon: '💳',
        description: 'Pay with Visa, Mastercard, or Verve',
        supported: true
      },
      {
        id: 'mobile_money',
        name: 'Mobile Money',
        icon: '📱',
        description: 'Pay with MTN Mobile Money, Vodafone Cash, or AirtelTigo Money',
        supported: true,
        providers: [
          { id: 'mtn', name: 'MTN Mobile Money', code: 'mtn' },
          { id: 'vodafone', name: 'Vodafone Cash', code: 'vodafone' },
          { id: 'airteltigo', name: 'AirtelTigo Money', code: 'airteltigo' }
        ]
      }
    ]
  });
};

// @desc    Get payment history for user
// @route   GET /api/payments/history
// @access  Private
const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate('bookingId', 'pickupDate returnDate totalAmount')
      .sort('-createdAt');
    
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get payment details
// @route   GET /api/payments/:id
// @access  Private
const getPaymentDetails = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('userId', 'fullName email phone')
      .populate('bookingId', 'pickupDate returnDate totalAmount carId')
      .populate({
        path: 'bookingId',
        populate: {
          path: 'carId',
          select: 'name brand mainImage'
        }
      });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Check authorization
    if (payment.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get vendor earnings
// @route   GET /api/payments/earnings
// @access  Private/Vendor
const getVendorEarnings = async (req, res) => {
  try {
    // Get all bookings for vendor's cars
    const bookings = await Booking.find({ vendorId: req.user._id, paymentStatus: 'paid' });
    
    const totalEarnings = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    const totalBookings = bookings.length;
    
    // Get monthly earnings breakdown
    const monthlyEarnings = await Booking.aggregate([
      { 
        $match: { 
          vendorId: req.user._id,
          paymentStatus: 'paid'
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
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    
    res.json({
      totalEarnings,
      totalBookings,
      monthlyEarnings,
      currency: 'GHS'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Webhook for Paystack (to handle payment events)
// @route   POST /api/payments/webhook
// @access  Public
const paymentWebhook = async (req, res) => {
  try {
    const event = req.body;
    
    // Verify webhook signature
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ message: 'Invalid signature' });
    }
    
    // Handle different events
    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      
      const payment = await Payment.findOne({ reference });
      if (payment && payment.status !== 'success') {
        payment.status = 'success';
        payment.transactionId = event.data.reference;
        payment.gatewayResponse = event.data;
        payment.paidAt = new Date();
        await payment.save();
        
        // Update booking
        await Booking.findByIdAndUpdate(payment.bookingId, {
          paymentStatus: 'paid',
          status: 'confirmed'
        });
      }
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

module.exports = {
  initializePayment,
  initializeMobileMoney,
  initializeCardPayment,
  verifyPayment,
  getPaymentHistory,
  getPaymentDetails,
  getVendorEarnings,
  getPaymentMethods,
  paymentWebhook
};