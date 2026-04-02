const router = require("express").Router();
const prisma = require("../prismaClient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
    process.exit(1);
}

// 1. PUBLIC COMPANY SIGNUP (SaaS Gateway)
router.post("/signup-company", async (req, res) => {
    const { companyName, ownerName, email, phoneNumber, password } = req.body;
    
    try {
        if (!companyName || !ownerName || !email || !password) {
            return res.status(400).json({ error: "Intelligence gap: All fields required for provisioning." });
        }

        // Set 18-month trial expiry
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 18);

        const result = await prisma.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: {
                    name: companyName,
                    email: email,
                    expiryDate: expiry,
                    subscriptionStatus: "TRIAL",
                    plan: "NONE"
                }
            });

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await tx.user.create({
                data: {
                    name: ownerName,
                    email,
                    phoneNumber,
                    password: hashedPassword,
                    role: "admin",
                    companyId: company.id
                }
            });

            return { company, user };
        });

        res.json({ 
            message: "Company Provisioned. TwishhSync Stealth Trial Active (18 Months).", 
            company: result.company,
            userId: result.user.id
        });
    } catch (err) {
        res.status(500).json({ error: "SaaS provisioning failed", msg: err.message });
    }
});

router.post("/register", verifyAdmin, async (req, res) => {
    const { name, email, phoneNumber, password, departmentId } = req.body;
    try {
        const companyId = req.user.companyId; // Inherit from registree

        // Limit Enforcement: Check employee count for non-PRO plans
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (company.plan !== "PRO" && company.employeeLimit !== -1) {
            const count = await prisma.user.count({ where: { companyId, isArchived: false } });
            if (count >= company.employeeLimit) {
                return res.status(403).json({ error: `Scale limit reached. Current plan allows max ${company.employeeLimit} units.` });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const dataPayload = { 
            name, 
            email: email || null, 
            phoneNumber: phoneNumber || null,
            password: hashedPassword, 
            role: "employee",
            companyId
        };
        if (departmentId) dataPayload.departmentId = parseInt(departmentId);

        const user = await prisma.user.create({ data: dataPayload });
        res.json({ message: "User securely registered.", user: { _id: user.id, name: user.name, email: user.email, phoneNumber: user.phoneNumber }});
    } catch (err) {
        res.status(500).json({ error: "Registration failed", msg: err.message });
    }
});

router.post("/login", async (req, res) => {
    const { email, phoneNumber, password, deviceId } = req.body;
    try {
        let user;
        if (email) {
            user = await prisma.user.findUnique({ where: { email }, include: { company: true } });
        } else if (phoneNumber) {
            user = await prisma.user.findUnique({ where: { phoneNumber }, include: { company: true } });
        }

        if (!user) return res.status(401).json({ error: "Invalid identity credentials." });
        if (user.isArchived) return res.status(403).json({ error: "Access Denied. Identity Archived." });

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(401).json({ error: "Invalid access key." });

        // Update Subscription Status if Expired
        let subStatus = user.company.subscriptionStatus;
        if (new Date() > user.company.expiryDate && subStatus !== "EXPIRED") {
            await prisma.company.update({ where: { id: user.companyId }, data: { subscriptionStatus: "EXPIRED" } });
            subStatus = "EXPIRED";
        }

        // HARDWARE BINDING PROTOCOL (Employees only)
        if (user.role === 'employee') {
            if (!deviceId) return res.status(400).json({ error: "Hardware Signature Required." });
            
            if (!user.deviceId) {
                await prisma.user.update({ where: { id: user.id }, data: { deviceId } });
            } else if (user.deviceId !== deviceId) {
                return res.status(403).json({ error: "Security Breach: Identity locked to another hardware unit." });
            }
        }

        const tokenPayload = { 
            id: user.id, 
            email: user.email, 
            phoneNumber: user.phoneNumber, 
            role: user.role,
            companyId: user.companyId,
            companyName: user.company.name,
            subscriptionStatus: subStatus
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "24h" });

        res.json({ 
            token, 
            user: { 
                _id: user.id, 
                name: user.name, 
                email: user.email, 
                phoneNumber: user.phoneNumber, 
                role: user.role,
                companyId: user.companyId,
                companyName: user.company.name,
                companyLogo: user.company.logo,
                subscriptionStatus: subStatus,
                expiryDate: user.company.expiryDate
            } 
        });
    } catch (err) {
        res.status(500).json({ error: "Authentication failed", msg: err.message });
    }
});

// NEW: Identity Security Protocol - Change Password
router.patch("/change-password/:id", verifyToken, async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    try {
        if (parseInt(id) !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ error: "Access Denied. You can only change your own password." });
        }
        const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
        if (!user) return res.status(404).json({ error: "Identity not found." });

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) return res.status(401).json({ error: "Current Access Key is invalid." });

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: parseInt(id) },
            data: { password: hashedNewPassword }
        });

        res.json({ message: "Security protocol updated successfully." });
    } catch (err) {
        res.status(500).json({ error: "Update failed", msg: err.message });
    }
});

module.exports = router;