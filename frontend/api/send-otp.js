import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // 1. Security Check: Only allow POST requests with a valid bridge key
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, otp, bridgeKey } = req.body;

  if (!bridgeKey || bridgeKey !== process.env.MAIL_BRIDGE_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Bridge Key' });
  }

  // 2. Configure Transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
  });

  try {
    console.log(`[MAIL_BRIDGE] Forwarding OTP to ${email}`);

    await transporter.sendMail({
        from: `"TwishhSync Security" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Verify Your New Device - TwishhSync",
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
                <h2 style="color: #6366f1; margin-bottom: 20px;">TwishhSync Security</h2>
                <p>A new device was detected attempting to access your account.</p>
                <div style="background: #f4f4f5; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #18181b;">${otp}</span>
                </div>
                <p style="color: #71717a; font-size: 12px;">If this wasn't you, please secure your account immediately. This code expires in 20 minutes.</p>
            </div>
        `
    });

    return res.status(200).json({ success: true, message: 'Email sent via Vercel Bridge' });
  } catch (error) {
    console.error('[MAIL_BRIDGE] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
