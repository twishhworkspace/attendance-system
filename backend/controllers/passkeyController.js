const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const prisma = require('../db');
const jwt = require('jsonwebtoken');
const { logAction } = require('../utils/logger');

// The RP (Relying Party) is your website
const rpName = 'TwishhSync Advanced Systems';
const rpID = process.env.RP_ID || 'localhost'; // Should be your domain in production
const origin = process.env.ORIGIN || `http://${rpID}:5173`;

// --- Registration (Enrolment) ---

const getRegOptions = async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { authenticators: true }
    });

    const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userID: user.id,
        userName: user.email,
        attestationType: 'none',
        excludeCredentials: user.authenticators.map((auth) => ({
            id: auth.credentialID,
            type: 'public-key',
        })),
        authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'preferred',
            authenticatorAttachment: 'platform', // Forces phone/laptop biometrics
        },
    });

    // Store challenge to verify later
    await prisma.user.update({
        where: { id: user.id },
        data: { currentChallenge: options.challenge }
    });

    res.json(options);
};

const verifyReg = async (req, res) => {
    const { body } = req;
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { authenticators: true }
    });

    const expectedChallenge = user.currentChallenge;

    try {
        const verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
        });

        if (verification.verified) {
            const { registrationInfo } = verification;
            const { credentialPublicKey, credentialID, counter } = registrationInfo;

            await prisma.authenticator.create({
                data: {
                    credentialID: Buffer.from(credentialID),
                    credentialPublicKey: Buffer.from(credentialPublicKey),
                    counter: BigInt(counter),
                    credentialDeviceType: registrationInfo.credentialDeviceType,
                    credentialBackedUp: registrationInfo.credentialBackedUp,
                    userId: user.id
                }
            });

            await logAction({
                companyId: user.companyId,
                userId: user.id,
                action: 'BIOMETRIC_ENROLLED',
                details: 'Device biometric signature registered',
                ip: req.ip
            });

            res.json({ verified: true });
        } else {
            res.status(400).json({ error: 'Verification failed' });
        }
    } catch (error) {
        console.error('Biometric Registration Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        await prisma.user.update({ where: { id: user.id }, data: { currentChallenge: null } });
    }
};

// --- Authentication (Fast Login) ---

const getAuthOptions = async (req, res) => {
    const { email } = req.query; // Login starts with an email to find the user
    const user = await prisma.user.findUnique({
        where: { email },
        include: { authenticators: true }
    });

    if (!user || user.authenticators.length === 0) {
        return res.status(404).json({ error: 'No biometric credentials found for this account.' });
    }

    const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: user.authenticators.map((auth) => ({
            id: auth.credentialID,
            type: 'public-key',
            transports: auth.transports ? auth.transports.split(',') : undefined,
        })),
        userVerification: 'preferred',
    });

    await prisma.user.update({
        where: { id: user.id },
        data: { currentChallenge: options.challenge }
    });

    res.json(options);
};

const verifyAuth = async (req, res) => {
    const { body, email } = req.body;
    const user = await prisma.user.findUnique({
        where: { email },
        include: { authenticators: true }
    });

    const dbAuthenticator = user.authenticators.find(auth => 
        Buffer.from(auth.credentialID).toString('base64url') === body.id
    );

    if (!dbAuthenticator) {
        return res.status(400).json({ error: 'Authenticator not found' });
    }

    try {
        const verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge: user.currentChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            authenticator: {
                credentialID: dbAuthenticator.credentialID,
                credentialPublicKey: dbAuthenticator.credentialPublicKey,
                counter: dbAuthenticator.counter,
            },
        });

        if (verification.verified) {
            // Update counter to prevent replay attacks
            await prisma.authenticator.update({
                where: { id: dbAuthenticator.id },
                data: { counter: BigInt(verification.authenticationInfo.newCounter) }
            });

            // Issue JWT
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role, companyId: user.companyId },
                process.env.JWT_SECRET,
                { expiresIn: '30d' }
            );

            // Set Secure HttpOnly Cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            await logAction({
                companyId: user.companyId,
                userId: user.id,
                action: 'BIOMETRIC_LOGIN',
                details: 'Successful fingerprint/passkey login',
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
        } else {
            res.status(401).json({ error: 'Biometric verification failed' });
        }
    } catch (error) {
        console.error('Biometric Authentication Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        await prisma.user.update({ where: { id: user.id }, data: { currentChallenge: null } });
    }
};

module.exports = { getRegOptions, verifyReg, getAuthOptions, verifyAuth };
