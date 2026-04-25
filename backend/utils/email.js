const nodemailer = require('nodemailer');

/**
 * Sends a real email using SMTP configuration from environment variables.
 */
const sendOTP = async (email, otp) => {
    // 1. Create a transporter using your SMTP credentials
    // These should be set in your Render environment variables
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    try {
        console.log(`[AUTH_SERVICE] Attempting to send real OTP to ${email}`);

        // 2. Define the email content
        const info = await transporter.sendMail({
            from: `"TwishhSync Security" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Verify Your New Device - TwishhSync",
            text: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
                    <h2 style="color: #6366f1; margin-bottom: 20px;">TwishhSync Security</h2>
                    <p>A new device was detected attempting to access your account.</p>
                    <div style="background: #f4f4f5; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #18181b;">${otp}</span>
                    </div>
                    <p style="color: #71717a; font-size: 12px;">If this wasn't you, please secure your account immediately. This code expires in 10 minutes.</p>
                </div>
            `
        });

        console.log(`[AUTH_SERVICE] Email sent successfully: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('[AUTH_SERVICE] Email Sending Failed:', error);
        // Fallback: Still log the OTP so you can find it in Render logs if the mailer fails
        console.log(`[FALLBACK] OTP for ${email} is ${otp}`);
        return false;
    }
};

module.exports = { sendOTP };
