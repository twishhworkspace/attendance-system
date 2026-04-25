// server/utils/email.js

/**
 * Mocks the sending of an OTP to an email address.
 * In a production environment, this would integrate with NodeMailer, SendGrid, etc.
 */
const sendOTP = async (email, otp) => {
  console.log(`[AUTH_SERVICE] Sending OTP ${otp} to ${email}`);
  
  // Return true to simulate a successful send
  return true;
};

module.exports = { sendOTP };
