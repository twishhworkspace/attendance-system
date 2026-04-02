// 1. SESSION STATUS PROTOCOL
router.get("/status/:userId", verifyToken, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);
        
        // Security check: Must be the user themselves or an admin from the same company
        if (targetUserId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ error: "Access Denied. Identity mismatch." });
        }

        const activeSession = await prisma.attendance.findFirst({
            where: {
                userId: targetUserId,
                checkOut: null,
                user: { companyId: req.user.companyId }
            },
            orderBy: { date: 'desc' }
        });
        
        let mapped = null;
        if (activeSession) {
            mapped = { ...activeSession, _id: activeSession.id };
        }

        res.json({ isCheckedIn: !!activeSession, activeSession: mapped });
    } catch (err) {
        res.status(500).json({ error: "Pulse failed", msg: err.message });
    }
});

// 2. ENTRY PROTOCOL (CHECK-IN)
router.post("/checkin", verifyToken, async (req, res) => {
    const { location } = req.body;
    const userId = req.user.id; // Enforce token identity

    if (!location) {
        return res.status(400).json({ error: "Tactical data incomplete (Missing Location)." });
    }

    try {
        // Interlock: Detect active session
        const active = await prisma.attendance.findFirst({
            where: { userId, checkOut: null }
        });
        if (active) return res.status(403).json({ error: "Active protocol already in progress." });

        const record = await prisma.attendance.create({
            data: {
                userId,
                location,
                checkIn: new Date().toISOString()
            }
        });
        res.json({ ...record, _id: record.id });
    } catch (err) {
        res.status(500).json({ error: "Checkin failed", msg: err.message });
    }
});

// 2.5 ENTRY PROTOCOL (OUT OF LOCATION REQUEST)
router.post("/request", verifyToken, async (req, res) => {
    const { location, reason } = req.body;
    const userId = req.user.id;

    if (!reason) {
        return res.status(400).json({ error: "Uplink anomaly: Reason required for remote entry." });
    }

    try {
        const active = await prisma.attendance.findFirst({
            where: { userId, checkOut: null }
        });
        if (active) return res.status(403).json({ error: "Active protocol already in progress." });

        const record = await prisma.attendance.create({
            data: {
                userId,
                location: location || "Out of Location",
                checkIn: "OFF-SITE",
                status: "PENDING",
                reason
            }
        });
        res.json({ ...record, _id: record.id });
    } catch (err) {
        res.status(500).json({ error: "Remote Entry failed", msg: err.message });
    }
});

// 3. EXIT PROTOCOL (CHECK-OUT)
router.post("/checkout", verifyToken, async (req, res) => {
    const userId = req.user.id; // Enforce token identity

    try {
        // Interlock: Verify active session exists
        const record = await prisma.attendance.findFirst({
            where: { userId, checkOut: null },
            orderBy: { date: 'desc' }
        });

        if (!record) return res.status(403).json({ error: "No active check-in protocol found for this identity." });

        const updated = await prisma.attendance.update({
            where: { id: record.id },
            data: { checkOut: new Date().toISOString() }
        });
        res.json({ ...updated, _id: updated.id });
    } catch (err) {
        res.status(500).json({ error: "Checkout failed", msg: err.message });
    }
});

router.get("/all", verifyAdmin, async (req, res) => {
    try {
        const data = await prisma.attendance.findMany({
            where: { user: { companyId: req.user.companyId } },
            orderBy: { date: 'desc' },
            include: { user: true }
        });
        res.json(data.map(r => ({ ...r, _id: r.id })));
    } catch (err) {
        res.status(500).json({ error: "Fetch failed", msg: err.message });
    }
});

// 4. EMPLOYEE ACCESS: NOTICES (SAAS SCOPED)
router.get("/notices", verifyToken, async (req, res) => {
    try {
        const notices = await prisma.notice.findMany({ 
            where: { companyId: req.user.companyId },
            orderBy: { date: 'desc' }, 
            take: 10 
        });
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0,0,0,0);
        
        const nextDayHoliday = await prisma.holiday.findFirst({ 
            where: { 
                date: tomorrow,
                companyId: req.user.companyId
            } 
        });
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
        res.status(500).json({ error: "Notice uplink failed", msg: err.message });
    }
});

// 5. EMPLOYEE ACCESS: PERSONAL HISTORY
router.get("/history/:userId", verifyToken, async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    // Security: Only allow self-viewing or admin viewing
    if (userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Access Denied. Identity mismatch." });
    }

    try {
        const history = await prisma.attendance.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
            take: 50
        });
        res.json(history.map(r => ({ ...r, _id: r.id })));
    } catch (err) {
        res.status(500).json({ error: "History retrieval failed", msg: err.message });
    }
});

// 6. SYSTEM CONFIGURATION (SAAS SCOPED)
router.get("/config", verifyToken, async (req, res) => {
    try {
        const locations = await prisma.officeLocation.findMany({
            where: { companyId: req.user.companyId }
        });
        res.json(locations.map(l => ({ ...l, _id: l.id })));
    } catch (err) {
        res.status(500).json({ error: "Config fetch failed" });
    }
});

module.exports = router;