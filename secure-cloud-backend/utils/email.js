const nodemailer = require('nodemailer');

// This function will be called after a file is shared.
// Returns true if the email was sent, false otherwise (never throws).
const sendShareEmail = async (recipientEmail, sharerEmail, fileDetails, shareLink) => {
  if (!process.env.ETHEREAL_USER || !process.env.ETHEREAL_PASS) {
    console.log('ℹ️ Email not configured (ETHEREAL_USER/ETHEREAL_PASS missing). Skipping share email.');
    return false;
  }

  try {
    // For development, we'll use a test account from Ethereal.
    // In a real application, you'd use a service like Gmail, SendGrid, etc.
    let transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.ETHEREAL_USER, // Test user from .env
        pass: process.env.ETHEREAL_PASS, // Test pass from .env
      },
    });

    // Email content
    let info = await transporter.sendMail({
      from: `"SecureChain" <noreply@securechain.com>`,
      to: recipientEmail,
      subject: `A file has been shared with you by ${sharerEmail}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Hello,</h2>
          <p>${sharerEmail} has securely shared a file with you:</p>
          <p><strong>File:</strong> ${fileDetails.originalName}</p>
          <p>You can download it using the secure link below. You will be required to log in as ${recipientEmail} to access the file.</p>
          <p style="text-align: center;">
            <a href="${shareLink}" style="background-color: #2563EB; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Download File
            </a>
          </p>
          <p>This link is secure and intended only for you.</p>
          <hr/>
          <p style="font-size: 0.8em; color: #777;">Sent via SecureChain</p>
        </div>
      `,
    });

    console.log('✅ Email sent successfully!');
    // You can preview the sent email at the URL Nodemailer logs to the console
    console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return false;
  }
};

module.exports = { sendShareEmail };