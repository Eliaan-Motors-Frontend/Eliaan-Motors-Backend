const { sendEmail } = require('../utils/emailService');

// @desc    Send contact message
// @route   POST /api/contact
// @access  Public
const sendContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Validate input
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }
    
    // Email to admin (you)
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>New Contact Message</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .info-box { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10B981; }
          .info-item { margin-bottom: 10px; }
          .info-label { font-weight: bold; color: #333; }
          .message-box { background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 New Contact Message</h1>
          </div>
          <div class="content">
            <p>You have received a new message from your website contact form:</p>
            
            <div class="info-box">
              <div class="info-item">
                <span class="info-label">From:</span> ${name}
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span> ${email}
              </div>
              <div class="info-item">
                <span class="info-label">Subject:</span> ${subject}
              </div>
              <div class="info-item">
                <span class="info-label">Date:</span> ${new Date().toLocaleString()}
              </div>
            </div>
            
            <div class="message-box">
              <strong>Message:</strong><br/>
              ${message.replace(/\n/g, '<br/>')}
            </div>
            
            <p>You can reply to this person directly at: <a href="mailto:${email}">${email}</a></p>
          </div>
          <div class="footer">
            <p>Eliaan Motors Contact System</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Send email to admin (you)
    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: `📧 New Contact Message: ${subject}`,
      html: adminEmailHtml
    });
    
    // Confirmation email to user
    const userConfirmationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Message Received</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .success-icon { text-align: center; font-size: 48px; margin-bottom: 20px; }
          .message-summary { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10B981; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; background: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Thank You for Contacting Us!</h1>
          </div>
          <div class="content">
            <div class="success-icon">✅</div>
            <p>Dear <strong>${name}</strong>,</p>
            <p>Thank you for reaching out to <strong>Eliaan Motors</strong>. We have received your message and will get back to you within 24 hours.</p>
            
            <div class="message-summary">
              <strong>Your message summary:</strong><br/>
              <strong>Subject:</strong> ${subject}<br/>
              <strong>Message:</strong> ${message.substring(0, 200)}${message.length > 200 ? '...' : ''}
            </div>
            
            <p>If you have any urgent inquiries, please call us at <strong>+233 24 123 4567</strong>.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/" class="button">Visit Our Website</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Eliaan Motors. All rights reserved.</p>
            <p>Ashaley Botwe, Accra, Ghana</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Send confirmation email to user
    await sendEmail({
      to: email,
      subject: 'We Received Your Message - Eliaan Motors',
      html: userConfirmationHtml
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Message sent successfully! We will get back to you soon.' 
    });
    
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message. Please try again later.' 
    });
  }
};

module.exports = { sendContactMessage };