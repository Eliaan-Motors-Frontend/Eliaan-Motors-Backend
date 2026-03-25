const cron = require('node-cron');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Car = require('../models/Car');
const { sendBookingReminder } = require('./emailService');

// Run every hour (at minute 0 of every hour)
const startReminderJob = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('🕐 Running booking reminder check...', new Date().toISOString());
      
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);
      
      // Find bookings that start tomorrow
      const bookings = await Booking.find({
        status: 'confirmed',
        pickupDate: {
          $gte: tomorrow,
          $lte: tomorrowEnd
        },
        reminderSent: { $ne: true }
      }).populate('userId').populate('carId');
      
      let sentCount = 0;
      let errorCount = 0;
      
      for (const booking of bookings) {
        if (booking.userId && booking.carId) {
          try {
            await sendBookingReminder(booking, booking.userId, booking.carId);
            booking.reminderSent = true;
            await booking.save();
            sentCount++;
            console.log(`📧 Reminder sent for booking ${booking._id} - Car: ${booking.carId.name}`);
          } catch (emailError) {
            errorCount++;
            console.error(`❌ Failed to send reminder for booking ${booking._id}:`, emailError.message);
          }
        }
      }
      
      if (sentCount > 0 || errorCount > 0) {
        console.log(`✅ Reminder job completed: ${sentCount} sent, ${errorCount} failed`);
      } else {
        console.log(`✅ No reminders needed for tomorrow (${tomorrow.toLocaleDateString()})`);
      }
    } catch (error) {
      console.error('Reminder job error:', error);
    }
  });
  
  console.log('⏰ Booking reminder job scheduled (runs every hour)');
};

module.exports = startReminderJob;