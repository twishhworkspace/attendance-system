const xss = require('xss');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendOTP } = require('../utils/email');
const crypto = require('crypto');
const prisma = require('../db');

const login = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password?.trim();

  // Basic Input Validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email/Mobile and password are required' });
  }

  try {
    // Normalize identifier for mobile number search (strip spaces, dashes, etc.)
    const normalizedIdentifier = email.replace(/\D/g, '');
    
    const user = await prisma.user.findFirst({ 
        where: {
            OR: [
                { email: email },
                { mobileNumber: email },
                { mobileNumber: normalizedIdentifier.length >= 10 ? normalizedIdentifier : undefined }
            ]
        },
        include: { company: true }
    });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // RESTRICTION: Employees are restricted to Mobile Access only
    const ua = req.headers['user-agent'] || '';
    const isMobile = /mobile|iphone|ipad|android/i.test(ua);
    if (user.role === 'EMPLOYEE' && !isMobile && process.env.SECURITY_DISABLED !== 'true') {
        return res.status(403).json({ 
            error: 'Security Protocol: Employee access is restricted to mobile devices only. Please log in from your phone.' 
        });
    }

    if (user.company?.status === 'SUSPENDED' && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Your company access has been suspended by the platform administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const clientDeviceId = req.body.deviceId;

    // Device Verification Logic: Only enforce for EMPLOYEES
    if (user.role === 'EMPLOYEE' && process.env.SECURITY_DISABLED !== 'true') {
        if (user.deviceId && user.deviceId !== clientDeviceId) {
            // Rate Limiting: 2-minute cooldown between OTP generations
            if (user.otpExpiry) {
                const generatedAt = new Date(user.otpExpiry.getTime() - 10 * 60 * 1000);
                const cooldownEnd = new Date(generatedAt.getTime() + 2 * 60 * 1000);
                const now = new Date();
                
                if (now < cooldownEnd) {
                    const secondsLeft = Math.ceil((cooldownEnd - now) / 1000);
                    return res.status(429).json({ 
                        error: `Security Protocol: Please wait ${secondsLeft} seconds before requesting a new code.` 
                    });
                }
            }

            // New Device Detected - Generate OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 Minutes

            await prisma.user.update({
                where: { id: user.id },
                data: { otpCode: otp, otpExpiry }
            });

            const sent = await sendOTP(user.email, otp);
            if (!sent) return res.status(500).json({ error: 'Verification Service Unstable. Please try again later.' });

            return res.json({ 
                status: 'REQUIRE_OTP', 
                message: 'New device detected. Please enter the verification code sent to your email.' 
            });
        }
        
        // If it's their very first device, bind it silently
        if (!user.deviceId && clientDeviceId) {
            await prisma.user.update({
                where: { id: user.id },
                data: { deviceId: clientDeviceId }
            });
        }
    }

    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET is not defined in environment variables.');
      return res.status(500).json({ error: 'Authentication service misconfigured' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, companyId: user.companyId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Set Environment-Aware Cookie
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
        httpOnly: true,
        secure: isProd, // Only secure in prod
        sameSite: isProd ? 'none' : 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, sector: true, companyId: true, company: true, forgotCheckoutCount: true }
    });
    res.json(user);
  } catch (err) {
    console.error('Get Profile Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateProfile = async (req, res) => {
  const { name, email, password } = req.body;
  const userId = req.user.id;

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name ? xss(name) : undefined,
        email: email ? xss(email) : undefined,
        password: password ? await bcrypt.hash(password, 10) : undefined
      },
      select: { id: true, name: true, email: true, role: true, companyId: true, forgotCheckoutCount: true }
    });

    res.json(updated);
  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const registerCompany = async (req, res) => {
  const { companyName, adminName, email, password } = req.body;

  // Input Validation
  if (!companyName || !adminName || !email || !password) {
    return res.status(400).json({ error: 'All fields are required for registration.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // Check if company name already exists
    const existingCompany = await prisma.company.findUnique({ where: { name: companyName } });
    if (existingCompany) {
      return res.status(400).json({ error: 'Company name already in use.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Run within a transaction to ensure both company and user are created
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: companyName }
      });

      const user = await tx.user.create({
        data: {
          name: xss(adminName),
          email: xss(email),
          password: hashedPassword,
          role: 'COMPANY_ADMIN',
          companyId: company.id
        }
      });

      return { company, user };
    });

    // --- SESSION INITIALIZATION START ---
    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET is not defined in environment variables.');
      return res.status(500).json({ error: 'Authentication service misconfigured' });
    }

    const { user } = result;

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, companyId: user.companyId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Set Environment-Aware Cookie
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    // --- SESSION INITIALIZATION END ---

    res.status(201).json({ 
      message: 'Company Hub Initialized. Welcome to TwishhSync.', 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      }
    });
  } catch (err) {
    console.error('[CRITICAL] REGISTER COMPANY FAILURE:', err);
    res.status(500).json({ 
      error: 'Tactical Provisioning Failure', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

const verifyOTP = async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const { otp, deviceId } = req.body;

    // Allow empty string for deviceId but ensure it's provided in the request
    if (!email || !otp || deviceId === undefined) {
        return res.status(400).json({ error: 'Verification data incomplete' });
    }

    try {
        const normalizedIdentifier = email.replace(/\D/g, '');
        const user = await prisma.user.findFirst({ 
            where: {
                OR: [
                    { email: email },
                    { mobileNumber: email },
                    { mobileNumber: normalizedIdentifier.length >= 10 ? normalizedIdentifier : undefined }
                ]
            },
            include: { company: true }
        });
        if (!user) return res.status(401).json({ error: 'Invalid session' });

        // RESTRICTION: Employees are restricted to Mobile Access only
        const ua = req.headers['user-agent'] || '';
        const isMobile = /mobile|iphone|ipad|android/i.test(ua);
        if (user.role === 'EMPLOYEE' && !isMobile && process.env.SECURITY_DISABLED !== 'true') {
            return res.status(403).json({ 
                error: 'Security Protocol: Employee access is restricted to mobile devices only. Please log in from your phone.' 
            });
        }

        if (user.company?.status === 'SUSPENDED' && user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Your company access has been suspended by the platform administrator.' });
        }

        // Robust OTP matching (handles type mismatches, formatting, and whitespace)
        // Strips ALL non-digit characters to ensure 123 456 matches 123456
        const storedOtp = user.otpCode?.toString().replace(/\D/g, '');
        const inputOtp = otp?.toString().replace(/\D/g, '');

        const now = new Date();
        
        console.log(`[OTP_FORENSICS] Attempt for ${email}:`);
        console.log(`  - Input OTP:  [${inputOtp}]`);
        console.log(`  - Stored OTP: [${storedOtp}]`);
        console.log(`  - Current Time: ${now.toISOString()}`);
        console.log(`  - OTP Expiry:   ${user.otpExpiry?.toISOString()}`);
        console.log(`  - Match Status: ${storedOtp === inputOtp ? 'SUCCESS' : 'FAILURE'}`);
        console.log(`  - Expiry Status: ${now > user.otpExpiry ? 'EXPIRED' : 'VALID'}`);

        if (!storedOtp || storedOtp !== inputOtp) {
            return res.status(401).json({ error: 'Invalid verification code' });
        }

        if (now > user.otpExpiry) {
            return res.status(401).json({ error: 'Verification code expired' });
        }

        // OTP Verified - Bind new device
        await prisma.user.update({
            where: { id: user.id },
            data: { 
                deviceId,
                otpCode: null,
                otpExpiry: null
            }
        });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, companyId: user.companyId },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Set Environment-Aware Cookie
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('token', token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            path: '/',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        // Log Security Event
        await logAction({
            companyId: user.companyId,
            userId: user.id,
            action: 'DEVICE_REGISTERED',
            details: `New device authorized: ${deviceId}`,
            ip: req.ip
        });

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyId: user.companyId
            }
        });
    } catch (err) {
        console.error('OTP Verification Error:', err);
        res.status(500).json({ error: 'Verification failed' });
    }
};

const reportBug = async (req, res) => {
    const { category, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Feedback content is required' });

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { company: true }
        });

        if (!user) return res.status(401).json({ error: 'User context not found' });

        // Create a special support ticket with [BUG_REPORT] tag
        // If Super Admin, use the dedicated System Company cluster
        let targetCompanyId = user.companyId;
        if (user.role === 'SUPER_ADMIN' && !targetCompanyId) {
            const systemCompany = await prisma.company.findUnique({ where: { name: 'TwishhSync Global' } });
            targetCompanyId = systemCompany?.id || 'SYSTEM_MASTER';
        }

        const ticket = await prisma.supportTicket.create({
            data: {
                companyId: targetCompanyId,
                userId: user.id,
                subject: `[GLOBAL_REPORT] ${category || 'System bug'}`,
                description: message,
                priority: 'URGENT',
                status: 'OPEN'
            }
        });

        res.status(201).json({ message: 'Strategic report received. Master Control has been notified.', data: ticket });
    } catch (err) {
        console.error('Bug Report Error:', err);
        res.status(500).json({ error: 'Failed to transmit report.' });
    }
};

const logout = async (req, res) => {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/'
    });
    res.json({ message: 'Session terminated' });
};

module.exports = { login, getProfile, updateProfile, registerCompany, verifyOTP, reportBug, logout };
