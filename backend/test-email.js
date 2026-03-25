const nodemailer = require('nodemailer');
require('dotenv').config({ path: './.env' });

async function testEmail() {
  console.log('📧 Testing Gmail SMTP...');
  console.log('Email:', process.env.EMAIL_USER);
  console.log('Password:', process.env.EMAIL_PASS ? '✓ Set' : '✗ Missing');
  
  // Create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    // Send test email
    const info = await transporter.sendMail({
      from: `"Eliaan Motors" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'Test Email - Eliaan Motors',
      text: 'If you receive this, your email is working!',
      html: `
        <h1>✅ Email Working!</h1>
        <p>Your Eliaan Motors email configuration is correct.</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `,
    });
    
    console.log('✅ Test email sent!');
    console.log('Message ID:', info.messageId);
    console.log('Check your inbox/spam folder at:', process.env.EMAIL_USER);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure 2-Step Verification is enabled');
    console.log('2. Generate a NEW App Password');
    console.log('3. Check if your email/password is correct');
    console.log('4. Try using: EMAIL_PASS=xxxx xxxx xxxx xxxx (with spaces)');
  }
}

testEmail();