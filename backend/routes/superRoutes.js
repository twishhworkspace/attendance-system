const router = require("express").Router();
const prisma = require("../prismaClient");
const { verifySuperAdmin } = require("../middleware/authMiddleware");

// Helper to log administrative actions
async function logAction(action, superAdminId, targetCompanyId, details) {
    try {
        await prisma.auditLog.create({
            data: { action, superAdminId, targetCompanyId, details }
        });
    } catch (err) {
        console.error("Audit Logging Failed:", err);
    }
}

// 1. SUPER ADMIN DASHBOARD METRICS
router.get("/dashboard", verifySuperAdmin, async (req, res) => {
    try {
        const total = await prisma.company.count();
        const active = await prisma.company.count({ where: { subscriptionStatus: "ACTIVE" } });
        const trial = await prisma.company.count({ where: { subscriptionStatus: "TRIAL" } });
        const expired = await prisma.company.count({ where: { subscriptionStatus: "EXPIRED" } });

        res.json({ total, active, trial, expired });
    } catch (err) {
        res.status(500).json({ error: "Metrics extraction failed" });
    }
});

// 2. COMPANY MANAGEMENT
router.get("/companies", verifySuperAdmin, async (req, res) => {
    try {
        const companies = await prisma.company.findMany({
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { users: true } } }
        });
        res.json(companies);
    } catch (err) {
        res.status(500).json({ error: "Company fetch failed" });
    }
});

// 3. ACTIVATE / EXTEND PLAN
router.put("/companies/:id/activate", verifySuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { plan, durationMonths, adminNote } = req.body; // e.g., plan: "1Y", durationMonths: 12
        
        const company = await prisma.company.findUnique({ where: { id: parseInt(id) } });
        if (!company) return res.status(404).json({ error: "Company not found." });

        // Calculate new expiry date
        const newExpiry = new Date();
        newExpiry.setMonth(newExpiry.getMonth() + parseInt(durationMonths));

        // Determine employee limit based on plan
        const employeeLimit = (plan === "PRO" || plan === "5Y" || plan === "3Y") ? -1 : 50;

        const updated = await prisma.company.update({
            where: { id: parseInt(id) },
            data: {
                subscriptionStatus: "ACTIVE",
                plan: plan,
                expiryDate: newExpiry,
                employeeLimit,
                adminNote: adminNote || company.adminNote
            }
        });

        await logAction(`ACTIVATED_PLAN_${plan}`, req.user.id, updated.id, `Extended for ${durationMonths} months.`);

        res.json({ message: `Protocol ${plan} activated for ${updated.name}.`, company: updated });
    } catch (err) {
        res.status(500).json({ error: "Activation failed", msg: err.message });
    }
});

// 4. DEACTIVATE (MANUAL EXPIRY)
router.put("/companies/:id/deactivate", verifySuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await prisma.company.update({
            where: { id: parseInt(id) },
            data: { subscriptionStatus: "EXPIRED" }
        });

        await logAction("MANUAL_DEACTIVATION", req.user.id, updated.id, "Access restricted by SuperAdmin.");
        res.json({ message: `Access restricted for ${updated.name}.`, company: updated });
    } catch (err) {
        res.status(500).json({ error: "Deactivation failed" });
    }
});

// 5. AUDIT TRAIL
router.get("/audit-logs", verifySuperAdmin, async (req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({
            include: { 
                superAdmin: { select: { name: true, email: true } },
                targetCompany: { select: { name: true } }
            },
            orderBy: { timestamp: 'desc' },
            take: 100
        });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: "Logs fetch failed" });
    }
});

module.exports = router;
