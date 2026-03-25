const nodemailer = require('nodemailer');

// Create transporter with service-based config (this works!)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Test email configuration
const testEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service configured successfully');
    return true;
  } catch (error) {
    console.error('❌ Email service configuration failed:', error.message);
    return false;
  }
};

// Send email function
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: `"Eliaan Motors" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || html?.replace(/<[^>]*>/g, ''),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return { success: true, info };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Welcome Email
const sendWelcomeEmail = async (user, role) => {
  const subject = `Welcome to Eliaan Motors! 🚗`;
  const dashboardLink = role === 'vendor' ? `${process.env.FRONTEND_URL}/vendor` : `${process.env.FRONTEND_URL}/dashboard`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Eliaan Motors</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; }
        .content { padding: 30px; }
        .content h2 { color: #333; margin-top: 0; }
        .welcome-box { background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10B981; }
        .button { display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0; }
        .role-badge { display: inline-block; padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .user-badge { background-color: #e3f2fd; color: #1976d2; }
        .vendor-badge { background-color: #fff3e0; color: #ff9800; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚗 Eliaan Motors</h1>
          <p>Welcome to the family!</p>
        </div>
        <div class="content">
          <h2>Hello ${user.fullName},</h2>
          <p>Thank you for joining <strong>Eliaan Motors</strong>! We're thrilled to have you on board.</p>
          
          <div class="welcome-box">
            <strong>🎉 Your account has been successfully created!</strong><br/>
            <span>Account Type: </span>
            <span class="role-badge ${role === 'vendor' ? 'vendor-badge' : 'user-badge'}">
              ${role === 'vendor' ? '🚗 Vendor' : '👤 User'}
            </span>
            <br/><br/>
            <strong>Email:</strong> ${user.email}<br/>
            <strong>Phone:</strong> ${user.phone || 'Not provided'}<br/>
            ${role === 'vendor' ? `<strong>Business:</strong> ${user.businessName || 'N/A'}<br/>` : ''}
          </div>
          
          <p>Here's what you can do next:</p>
          <ul>
            ${role === 'vendor' ? `
              <li>🚗 List your cars for rent</li>
              <li>📊 Track your bookings and earnings</li>
              <li>💰 Receive payments securely</li>
            ` : `
              <li>🔍 Browse our wide selection of premium cars</li>
              <li>📅 Book cars for any duration</li>
              <li>💳 Pay securely with card or mobile money</li>
            `}
          </ul>
          
          <div style="text-align: center;">
            <a href="${dashboardLink}" class="button">Go to Dashboard</a>
          </div>
          
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            Need help? Contact our support team at ${process.env.EMAIL_USER}
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Eliaan Motors. All rights reserved.</p>
          <p>Ashaley Botwe, Accra, Ghana</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail({ to: user.email, subject, html });
};

// Booking Confirmation Email
const sendBookingConfirmation = async (booking, user, car) => {
  const subject = `🎉 Booking Confirmed - ${car.name}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Booking Confirmation</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; }
        .content { padding: 30px; }
        .booking-details { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10B981; }
        .button { background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚗 Eliaan Motors</h1>
          <p>Booking Confirmed!</p>
        </div>
        <div class="content">
          <h2>Hello ${user.fullName},</h2>
          <p>Your booking has been <strong>confirmed</strong>!</p>
          
          <div class="booking-details">
            <h3>📋 Booking Details</h3>
            <p><strong>Car:</strong> ${car.name} (${car.year})</p>
            <p><strong>Pickup:</strong> ${new Date(booking.pickupDate).toLocaleDateString()} at ${booking.pickupTime}</p>
            <p><strong>Return:</strong> ${new Date(booking.returnDate).toLocaleDateString()} at ${booking.returnTime}</p>
            <p><strong>Location:</strong> ${booking.pickupLocation}</p>
            <p><strong>Total Amount:</strong> GHS ${booking.totalAmount}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">View My Bookings</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Eliaan Motors</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail({ to: user.email, subject, html });
};

// Payment Confirmation Email
const sendPaymentConfirmation = async (payment, user, booking, car) => {
  const subject = `💰 Payment Confirmed - ${car.name}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payment Confirmation</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; }
        .content { padding: 30px; }
        .payment-details { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10B981; }
        .button { background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Eliaan Motors</h1>
          <p>Payment Received!</p>
        </div>
        <div class="content">
          <h2>Hello ${user.fullName},</h2>
          <p>Your payment has been received successfully!</p>
          
          <div class="payment-details">
            <h3>💳 Payment Details</h3>
            <p><strong>Reference:</strong> ${payment.reference}</p>
            <p><strong>Amount:</strong> GHS ${payment.amount}</p>
            <p><strong>Method:</strong> ${payment.paymentMethod === 'card' ? '💳 Card' : '📱 Mobile Money'}</p>
            <p><strong>Car:</strong> ${car.name}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Eliaan Motors</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail({ to: user.email, subject, html });
};

// Booking Reminder Email
const sendBookingReminder = async (booking, user, car) => {
  const subject = `⏰ Reminder: Your booking starts tomorrow!`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Booking Reminder</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center; }
        .reminder-box { background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .button { background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Eliaan Motors</h1>
          <p>Booking Reminder</p>
        </div>
        <div class="content" style="padding: 30px;">
          <h2>Hello ${user.fullName},</h2>
          <p>This is a reminder that your car rental starts <strong>tomorrow</strong>!</p>
          
          <div class="reminder-box">
            <strong>📅 Booking Details:</strong><br/>
            Car: ${car.name} (${car.year})<br/>
            Pickup: ${new Date(booking.pickupDate).toLocaleDateString()} at ${booking.pickupTime}<br/>
            Location: ${booking.pickupLocation}
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">View Details</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Eliaan Motors</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail({ to: user.email, subject, html });
};

// Password Reset Email
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const subject = '🔐 Password Reset Request';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Password Reset</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center; }
        .button { background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Eliaan Motors</h1>
          <p>Password Reset</p>
        </div>
        <div class="content" style="padding: 30px;">
          <h2>Hello ${user.fullName},</h2>
          <p>We received a request to reset your password. Click the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <p>This link expires in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Eliaan Motors</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail({ to: user.email, subject, html });
};

module.exports = {
  testEmailConfig,
  sendEmail,
  sendWelcomeEmail,
  sendBookingConfirmation,
  sendPaymentConfirmation,
  sendBookingReminder,
  sendPasswordResetEmail,
};