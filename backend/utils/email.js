const axios = require('axios');

/**
 * Sends an email by calling the Vercel Mail Bridge.
 * This bypasses Render's SMTP blocks by routing mail through Vercel.
 */
const sendOTP = async (email, otp) => {
    try {
        console.log(`[AUTH_SERVICE] Routing OTP through Vercel Bridge for ${email}`);

        const bridgeUrl = `${process.env.FRONTEND_URL}/api/send-otp`;
        
        const response = await axios.post(bridgeUrl, {
            email,
            otp,
            bridgeKey: process.env.MAIL_BRIDGE_KEY
        });

        if (response.data.success) {
            console.log(`[AUTH_SERVICE] Email sent successfully via Vercel Bridge`);
            return true;
        }
        
        throw new Error(response.data.error || 'Unknown Bridge Error');
    } catch (error) {
        console.error('[AUTH_SERVICE] Mail Bridge Failed:', error.response?.data || error.message);
        // Fallback: Still log the OTP so it can be found in Render logs
        console.log(`[FALLBACK] OTP for ${email} is ${otp}`);
        return false;
    }
};

module.exports = { sendOTP };
