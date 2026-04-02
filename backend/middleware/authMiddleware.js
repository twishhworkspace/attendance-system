const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Access Denied. No identity voucher found." });
    }

    try {
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
            process.exit(1);
        }
        const verified = jwt.verify(token, JWT_SECRET);
        
        // Attach identity context
        req.user = verified;
        
        // Subscription Enforcement (Exclude SuperAdmins)
        if (req.user.role !== "superadmin" && req.user.subscriptionStatus === "EXPIRED") {
            return res.status(403).json({ 
                error: "Service Restricted", 
                msg: "Your subscription has expired. Please contact twishhworkspace@gmail.com to activate." 
            });
        }

        next();
    } catch (err) {
        res.status(403).json({ error: "Invalid identity voucher. Re-authentication required." });
    }
};

const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role !== "admin" && req.user.role !== "superadmin") {
            return res.status(403).json({ error: "Access Denied. Elevated executive clearance required." });
        }
        next();
    });
};

const verifySuperAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role !== "superadmin") {
            return res.status(403).json({ error: "Access Denied. Only the SuperAdmin can access system protocols." });
        }
        next();
    });
};

module.exports = { verifyToken, verifyAdmin, verifySuperAdmin };
