const emailService = require('../services/emailService');

const sendWelcomeEmail = async (req, res) => {
  try {
    const { email, firstName } = req.body;
    
    if (!email || !firstName) {
      return res.status(400).json({ error: 'Email and firstName are required' });
    }

    await emailService.sendWelcomeEmail(email, firstName);
    
    res.status(200).json({ message: 'Welcome email sent successfully' });
  } catch (error) {
    console.error('Error in sendWelcomeEmail controller:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

const sendResetPasswordEmail = async (req, res) => {
  try {
    const { email, firstName, resetUrl } = req.body;

    if (!email || !firstName || !resetUrl) {
      return res.status(400).json({ error: 'Email, firstName and resetUrl are required' });
    }

    await emailService.sendResetPasswordEmail(email, firstName, resetUrl);

    res.status(200).json({ message: 'Reset password email sent successfully' });
  } catch (error) {
    console.error('Error in sendResetPasswordEmail controller:', error);
    res.status(500).json({ error: 'Failed to send reset password email' });
  }
};

module.exports = {
  sendWelcomeEmail,
  sendResetPasswordEmail
};
