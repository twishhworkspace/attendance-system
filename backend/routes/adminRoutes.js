const router = require("express").Router();
const prisma = require("../prismaClient");
const { verifyAdmin } = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");

// 1. EMPLOYEE MANAGEMENT (SAAS SCOPED)
router.get("/employees", verifyAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { 
                isArchived: false,
                companyId: req.user.companyId
            },
            select: { id: true, name: true, email: true, phoneNumber: true, role: true, deviceId: true, departmentId: true, department: true }
        });
        res.json(users.map(u => ({ ...u, _id: u.id })));
    } catch (err) {
        res.status(500).json({ error: "Intelligence fetch failed", msg: err.message });
    }
});

router.get("/employees/archived", verifyAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { 
                isArchived: true,
                companyId: req.user.companyId
            },
            select: { id: true, name: true, email: true, phoneNumber: true, role: true, deviceId: true, departmentId: true, department: true }
        });
        res.json(users.map(u => ({ ...u, _id: u.id })));
    } catch (err) {
        res.status(500).json({ error: "Graveyard fetch failed", msg: err.message });
    }
});

router.delete("/employees/:id", verifyAdmin, async (req, res) => {
    try {
        await prisma.user.update({
            where: { 
                id: parseInt(req.params.id),
                companyId: req.user.companyId
            },
            data: { isArchived: true }
        });
        res.json({ success: true, message: "Identity archived." });
    } catch (err) {
        res.status(500).json({ error: "Archive failed", msg: err.message });
    }
});

router.delete("/employees/:id/permanent", verifyAdmin, async (req, res) => {
    try {
        const uid = parseInt(req.params.id);
        await prisma.attendance.deleteMany({ where: { userId: uid } });
        await prisma.user.delete({ where: { id: uid } });
        res.json({ success: true, message: "Identity erased from protocol." });
    } catch (err) {
        res.status(500).json({ error: "Erasure failed", msg: err.message });
    }
});

router.put("/employees/:id/restore", verifyAdmin, async (req, res) => {
    try {
        await prisma.user.update({
            where: { 
                id: parseInt(req.params.id),
                companyId: req.user.companyId
            },
            data: { isArchived: false }
        });
        res.json({ success: true, message: "Identity restored." });
    } catch (err) {
        res.status(500).json({ error: "Restoration failed", msg: err.message });
    }
});
router.put("/employees/:id", verifyAdmin, async (req, res) => {
    try {
        const { name, email, phoneNumber, departmentId, password } = req.body;
        const dataPayload = {};
        
        if (name) dataPayload.name = name;
        if (email) dataPayload.email = email;
        if (phoneNumber) dataPayload.phoneNumber = phoneNumber;
        if (departmentId) dataPayload.departmentId = parseInt(departmentId);
        
        if (password && password.trim() !== '') {
            dataPayload.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(req.params.id) },
            data: dataPayload,
            select: { id: true, name: true, email: true, phoneNumber: true, departmentId: true, department: true }
        });

        res.json({ success: true, user: { ...updatedUser, _id: updatedUser.id }});
    } catch (err) {
        res.status(500).json({ error: "Profile edit failed", msg: err.message });
    }
});

router.put("/employees/:id/department", verifyAdmin, async (req, res) => {
    try {
        const deptId = req.body.departmentId ? parseInt(req.body.departmentId) : null;
        await prisma.user.update({
            where: { 
                id: parseInt(req.params.id),
                companyId: req.user.companyId
            },
            data: { departmentId: deptId }
        });
        res.json({ success: true, message: "Department re-linked." });
    } catch (err) {
        res.status(500).json({ error: "Relink failed", msg: err.message });
    }
});

// 2. ATTENDANCE ANALYTICS (SAAS SCOPED)
router.get("/attendance/:userId", verifyAdmin, async (req, res) => {
    const userId = parseInt(req.params.userId);
    const companyId = req.user.companyId;
    const { month, year } = req.query; 

    // Verification: target user must be in the same company
    const targetUser = await prisma.user.findFirst({ where: { id: userId, companyId } });
    if (!targetUser) return res.status(403).json({ error: "Access Denied. Identity belongs to another organization." });

    let where = { userId };
    if (month && year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1);
        where.date = { gte: startDate, lt: endDate };
    }

    try {
        const records = await prisma.attendance.findMany({
            where,
            orderBy: { date: 'desc' }
        });
        res.json(records.map(r => ({ ...r, _id: r.id })));
    } catch (err) {
        res.status(500).json({ error: "History fetch failed", msg: err.message });
    }
});

// 2.5 OUT OF LOCATION REQUESTS
router.get("/attendance/requests/pending", verifyAdmin, async (req, res) => {
    try {
        const records = await prisma.attendance.findMany({
            where: { 
                status: "PENDING",
                user: { companyId: req.user.companyId }
            },
            include: { user: { include: { department: true } } },
            orderBy: { date: 'desc' }
        });
        res.json(records.map(r => ({ ...r, _id: r.id })));
    } catch (err) {
        res.status(500).json({ error: "Fetch pending failed", msg: err.message });
    }
});

router.put("/attendance/requests/:id/approve", verifyAdmin, async (req, res) => {
    try {
        const updated = await prisma.attendance.update({
            where: { id: parseInt(req.params.id) },
            data: { status: "APPROVED" }
        });
        res.json({ success: true, record: { ...updated, _id: updated.id } });
    } catch (err) {
        res.status(500).json({ error: "Approve failed", msg: err.message });
    }
});

router.put("/attendance/requests/:id/reject", verifyAdmin, async (req, res) => {
    try {
        await prisma.attendance.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ success: true, message: "Request Rejected. Record Purged." });
    } catch (err) {
        res.status(500).json({ error: "Reject failed", msg: err.message });
    }
});

// 3. DEPARTMENT PROTOCOL (SECURE)
router.post("/departments", verifyAdmin, async (req, res) => {
    try {
        const { name, weeklyOff } = req.body;
        const companyId = req.user.companyId;

        const dept = await prisma.department.create({ 
            data: { 
                name, 
                weeklyOff: parseInt(weeklyOff || 0),
                companyId
            } 
        });
        res.json({ ...dept, _id: dept.id });
    } catch (err) {
        res.status(500).json({ error: "Creation failed", msg: err.message });
    }
});

router.get("/departments", verifyAdmin, async (req, res) => {
    try {
        const depts = await prisma.department.findMany({
            where: { companyId: req.user.companyId }
        });
        res.json(depts.map(d => ({ ...d, _id: d.id })));
    } catch (err) {
        res.status(500).json({ error: "Fetch failed", msg: err.message });
    }
});

router.put("/departments/:id", verifyAdmin, async (req, res) => {
    try {
        const { name, weeklyOff } = req.body;
        const data = {};
        if (name) data.name = name;
        if (weeklyOff !== undefined) data.weeklyOff = parseInt(weeklyOff);

        const updated = await prisma.department.update({
            where: { id: parseInt(req.params.id) },
            data
        });
        res.json({ ...updated, _id: updated.id });
    } catch (err) {
        res.status(500).json({ error: "Update failed", msg: err.message });
    }
});

router.delete("/departments/:id", verifyAdmin, async (req, res) => {
    try {
        await prisma.department.delete({ 
            where: { 
                id: parseInt(req.params.id),
                companyId: req.user.companyId
            } 
        });
        res.json({ success: true, message: "Department decommissioned." });
    } catch (err) {
        res.status(500).json({ error: "Deletion failed", msg: err.message });
    }
});

// 4. HOLIDAYS & EVENTS (SECURE)
router.post("/holidays", verifyAdmin, async (req, res) => {
    try {
        const d = new Date(req.body.date);
        d.setHours(0,0,0,0);
        const h = await prisma.holiday.create({ 
            data: { 
                date: d, 
                name: req.body.name, 
                type: req.body.type || 'HOLIDAY',
                companyId: req.user.companyId
            } 
        });
        res.json({ ...h, _id: h.id });
    } catch (err) {
        res.status(500).json({ error: "Marker failed", msg: err.message });
    }
});

router.get("/holidays", verifyAdmin, async (req, res) => {
    try {
        const h = await prisma.holiday.findMany();
        res.json(h.map(i => ({ ...i, _id: i.id })));
    } catch (err) {
        res.status(500).json({ error: "Schedule fetch failed", msg: err.message });
    }
});

router.delete("/holidays/:id", verifyAdmin, async (req, res) => {
    try {
        await prisma.holiday.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true, message: "Date cleared." });
    } catch (err) {
        res.status(500).json({ error: "Removal failed", msg: err.message });
    }
});

// 5. REPORTS ENGINE (SECURE)
router.get("/reports/daily-absent", verifyAdmin, async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date();
        endOfDay.setHours(23,59,59,999);
        const companyId = req.user.companyId;

        const absentees = await prisma.user.findMany({
            where: {
                isArchived: false,
                companyId: companyId,
                attendances: { none: { date: { gte: startOfDay, lte: endOfDay } } }
            },
            include: { department: true }
        });

        res.json(absentees.map(u => ({ ...u, _id: u.id })));
    } catch (err) {
        res.status(500).json({ error: "Daily scan failed", msg: err.message });
    }
});

// ENHANCED: Range-Based Aggregation
router.get("/reports/aggregate", verifyAdmin, async (req, res) => {
    try {
        const { type, year, month, from, to } = req.query;
        let startDate, endDate;

        if (type === 'monthly') {
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 1);
        } else if (type === 'yearly') {
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 11, 31, 23, 59, 59);
        } else if (type === 'range') {
            startDate = new Date(from);
            startDate.setHours(0,0,0,0);
            endDate = new Date(to);
            endDate.setHours(23,59,59,999);
        } else {
            return res.status(400).json({ error: "Uplink parameters invalid." });
        }

        const countWorkingDays = (start, end, offDay) => {
            let count = 0;
            let current = new Date(start);
            while (current <= end) {
                if (current.getDay() !== offDay) count++;
                current.setDate(current.getDate() + 1);
            }
            return count;
        };

        const users = await prisma.user.findMany({
            where: { isArchived: false },
            include: {
                department: true,
                attendances: {
                    where: { date: { gte: startDate, lte: endDate } }
                }
            }
        });

        res.json(users.map(u => {
            const daysCount = u.attendances.filter(a => a.status === 'PRESENT' || a.status === 'APPROVED').length;
            const offDay = u.department?.weeklyOff ?? 0;
            const diffDays = countWorkingDays(startDate, endDate, offDay);
            // Basic ratio (present / total days in range)
            const percentage = diffDays > 0 ? ((daysCount / diffDays) * 100).toFixed(1) : "0";

            return {
                _id: u.id,
                name: u.name,
                email: u.email,
                department: u.department,
                totalDays: daysCount,
                rangeDays: diffDays,
                percentage
            };
        }));
    } catch (err) {
        res.status(500).json({ error: "Intelligence aggregation collapsed", msg: err.message });
    }
});

router.get("/reports/detailed", verifyAdmin, async (req, res) => {
    try {
        const { from, to } = req.query;
        let where = { user: { companyId: req.user.companyId } };
        if (from && to) {
            where.date = { 
                gte: new Date(new Date(from).setHours(0,0,0,0)), 
                lte: new Date(new Date(to).setHours(23,59,59,999)) 
            };
        }
        const records = await prisma.attendance.findMany({
            where,
            include: { user: { include: { department: true } } },
            orderBy: { date: 'desc' }
        });
        res.json(records.map(r => ({ ...r, _id: r.id })));
    } catch (err) {
        res.status(500).json({ error: "Detailed scan failed", msg: err.message });
    }
});

// 6. BROADCASTS (SECURE)
router.post("/notices", verifyAdmin, async (req, res) => {
    try {
        const notice = await prisma.notice.create({ data: { message: req.body.message } });
        res.json({ ...notice, _id: notice.id });
    } catch (err) {
        res.status(500).json({ error: "Broadcast failed", msg: err.message });
    }
});

router.get("/notices", verifyAdmin, async (req, res) => {
    try {
        const notices = await prisma.notice.findMany({ orderBy: { date: 'desc' }, take: 10 });
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0,0,0,0);
        
        const nextDayHoliday = await prisma.holiday.findFirst({ where: { date: tomorrow } });
        const payload = notices.map(n => ({ ...n, _id: n.id }));

        if (nextDayHoliday) {
            const prefix = nextDayHoliday.type === "EVENT" ? "🎉 EVENT TOMORROW" : "🗓 HOLIDAY TOMORROW";
            payload.unshift({
                _id: "system-auto",
                message: `${prefix}: ${nextDayHoliday.name}`,
                date: tomorrow
            });
        }
        res.json(payload);
    } catch (err) {
        res.status(500).json({ error: "Uplink failed", msg: err.message });
    }
});

// 7. LOCATION MANAGEMENT (SAAS SCOPED)
router.get("/locations", verifyAdmin, async (req, res) => {
    try {
        const locations = await prisma.officeLocation.findMany({
            where: { companyId: req.user.companyId }
        });
        res.json(locations.map(l => ({ ...l, _id: l.id })));
    } catch (err) {
        res.status(500).json({ error: "Location fetch failed", msg: err.message });
    }
});

router.post("/locations", verifyAdmin, async (req, res) => {
    try {
        const { name, latitude, longitude } = req.body;
        const location = await prisma.officeLocation.create({
            data: { 
                name, 
                latitude: parseFloat(latitude), 
                longitude: parseFloat(longitude), 
                radius: 100.0,
                companyId: req.user.companyId
            }
        });
        res.json({ ...location, _id: location.id });
    } catch (err) {
        res.status(500).json({ error: "Location provisioning failed", msg: err.message });
    }
});

router.delete("/locations/:id", verifyAdmin, async (req, res) => {
    try {
        await prisma.officeLocation.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true, message: "Location decommissioned." });
    } catch (err) {
        res.status(500).json({ error: "Location purge failed", msg: err.message });
    }
});

module.exports = router;
