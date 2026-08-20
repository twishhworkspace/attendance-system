const prisma = require('../db');
const { getAttendanceDayStart, getISTDate, getShiftEnd } = require('../utils/timezone');
const { isWithinRange } = require('../utils/geofencing');

/**
 * Unified Maintenance Service
 * 1. Performs Auto-Checkouts for sessions past shift end.
 * 2. Marks missed check-ins as ABSENT after shift end.
 * 3. Handles the "3-Strike" policy.
 * 4. Performs data retention cleanup (4-year rule).
 * 5. Manages storage capacity (Rolling purge if DB > 450MB).
 */

async function performRetentionCleanup() {
    console.log('◇ [RETENTION] Scanning for expired data (4-year threshold)...');
    try {
        const fourYearsAgo = new Date();
        fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);

        const result = await prisma.attendance.deleteMany({
            where: {
                checkIn: { lt: fourYearsAgo }
            }
        });

        if (result.count > 0) {
            console.log(`✓ [RETENTION] Purged ${result.count} expired attendance records.`);
        }
    } catch (err) {
        console.error('⨯ [RETENTION] Cleanup Failure:', err);
    }
}

async function performCapacityCleanup() {
    console.log('◇ [CAPACITY] Evaluating database storage metrics...');
    try {
        // Query Postgres database size in MB
        const sizeResult = await prisma.$queryRaw`SELECT pg_database_size(current_database()) / (1024 * 1024) as size_mb`;
        const currentSizeMb = Number(sizeResult[0].size_mb);
        
        const MAX_SIZE_MB = 450; // Leaving a safe buffer for the 512MB limit
        const PURGE_BATCH = 5000; // Records to delete if over capacity

        console.log(`◇ [CAPACITY] Status: ${currentSizeMb}MB / ${MAX_SIZE_MB}MB Limit`);

        if (currentSizeMb > MAX_SIZE_MB) {
            console.log(`⚠️ [CAPACITY] Storage threshold breached. Initiating rolling purge of ${PURGE_BATCH} oldest records.`);
            
            // Fetch IDs of oldest records to ensure precision in deletion
            const oldestRecords = await prisma.attendance.findMany({
                orderBy: { checkIn: 'asc' },
                take: PURGE_BATCH,
                select: { id: true }
            });

            if (oldestRecords.length > 0) {
                const ids = oldestRecords.map(r => r.id);
                await prisma.attendance.deleteMany({
                    where: { id: { in: ids } }
                });
                console.log(`✓ [CAPACITY] Emergency purge complete. Space reclaimed.`);
            }
        }
    } catch (err) {
        // Fallback for non-Postgres environments or permission issues
        console.warn('⨯ [CAPACITY] Metric acquisition failed. Skipping size-based cleanup.');
    }
}

async function runMaintenanceCycle() {

    console.log('◇ [MAINTENANCE] Starting Strategic Synchronization...');
    try {
        const now = new Date();
        
        // Define concluded attendance day boundary (e.g., if now is Tue 6 AM, concludedDayEnd is Tue 5 AM, concludedDayStart is Mon 5 AM)
        const concludedDayEnd = getAttendanceDayStart(now);
        const concludedDayStart = new Date(concludedDayEnd.getTime() - 24 * 60 * 60 * 1000);

        const companies = await prisma.company.findMany({
            where: { status: 'ACTIVE' },
            include: { offices: true }
        });

        for (const company of companies) {
            // Find the primary office for end-time (or use default 20:00)
            const primaryOffice = company.offices[0] || { endTime: "20:00" };
            const [endH, endM] = (primaryOffice.endTime || "20:00").split(':').map(Number);

            // 1. AUTO-CHECKOUT SWEEP (For people who checked in but didn't check out before concludedDayEnd)
            const activeSessions = await prisma.attendance.findMany({
                where: {
                    companyId: company.id,
                    checkOut: null,
                    checkIn: { lt: concludedDayEnd }
                },
                include: { user: true }
            });

            for (const session of activeSessions) {
                // Determine the correct shift end time for this specific session/office
                const { matchedOffice } = isWithinRange(session.checkInLocation, company.offices);
                const resolvedOffice = matchedOffice || company.offices[0] || { endTime: "20:00" };
                const sessionShiftEnd = getShiftEnd(session.checkIn, resolvedOffice.endTime || "20:00");

                // Skip if shift hasn't ended yet (supports night shifts working past 5:00 AM IST Day start)
                if (now < sessionShiftEnd) {
                    console.log(`◇ [MAINTENANCE] Skipping active session for user ${session.userId} (shift ends at ${sessionShiftEnd.toISOString()})`);
                    continue;
                }

                const user = session.user;
                const newForgotCount = user.forgotCheckoutCount + 1;
                let status = session.status;
                let notes = "Autocheckout"; // User requested specifically this note

                if (newForgotCount >= 3) {
                    status = "ABSENT";
                    notes += " | SYSTEM_TERMINATION: Missed checkout threshold (3/3) reached. Record penalized.";
                } else {
                    notes += ` | COMPLIANCE_WARNING: Automatic handshake termination (${newForgotCount}/3).`;
                }

                await prisma.$transaction([
                    prisma.attendance.update({
                        where: { id: session.id },
                        data: {
                            checkOut: sessionShiftEnd,
                            isAutoCheckout: true,
                            status: status,
                            notes: notes
                        }
                    }),
                    prisma.user.update({
                        where: { id: user.id },
                        data: { forgotCheckoutCount: newForgotCount }
                    })
                ]);
                console.log(`✓ [MAINTENANCE] Auto-checked out user ${user.id} (Company: ${company.name})`);
            }

            // 2. ABSENT SWEEP (For people who NEVER checked in for the concluded day)
            const allEmployees = await prisma.user.findMany({
                where: { companyId: company.id, role: 'EMPLOYEE' }
            });

            const checkedInUserIds = (await prisma.attendance.findMany({
                where: { 
                    companyId: company.id, 
                    checkIn: { gte: concludedDayStart, lt: concludedDayEnd } 
                },
                select: { userId: true }
            })).map(a => a.userId);

            const absentUsers = allEmployees.filter(u => !checkedInUserIds.includes(u.id));

            const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const istConcludedDate = getISTDate(concludedDayStart);
            const concludedDayName = daysOfWeek[istConcludedDate.getUTCDay()];

            for (const user of absentUsers) {
                const isWeeklyOffDay = (user.weeklyOff || 'Sunday').toLowerCase() === concludedDayName.toLowerCase();

                // Avoid double-creating absent or weekly off records if the cycle runs multiple times
                const existingRecord = await prisma.attendance.findFirst({
                    where: {
                        userId: user.id,
                        checkIn: { gte: concludedDayStart, lt: concludedDayEnd },
                        status: { in: ['ABSENT', 'WEEKLY_OFF'] }
                    }
                });

                if (!existingRecord) {
                    await prisma.attendance.create({
                        data: {
                            userId: user.id,
                            companyId: company.id,
                            checkIn: concludedDayStart,
                            checkOut: concludedDayStart,
                            status: isWeeklyOffDay ? 'WEEKLY_OFF' : 'ABSENT',
                            notes: isWeeklyOffDay 
                                ? 'SYSTEM_GEN: Scheduled weekly off day.' 
                                : 'SYSTEM_GEN: No attendance handshake detected by end of day.'
                        }
                    });
                    console.log(`✓ [MAINTENANCE] Marked user ${user.id} as ${isWeeklyOffDay ? 'WEEKLY_OFF' : 'ABSENT'} (Company: ${company.name})`);
                }
            }
        }

        // 3. POLICY ENFORCEMENT (Retention & Capacity)
        await performRetentionCleanup();
        
        // Only perform intensive capacity check once a day (at midnight IST cycle)
        if (getISTDate(now).getUTCHours() === 0) {
            await performCapacityCleanup();
        }

        console.log('◇ [MAINTENANCE] Synchronization Complete.');

    } catch (err) {
        console.error('⨯ [MAINTENANCE] Operational Failure:', err);
    }
}

const startMaintenanceService = () => {
    // Run every hour
    setInterval(runMaintenanceCycle, 60 * 60 * 1000);
    // Also run once on startup
    runMaintenanceCycle();
};

module.exports = { startMaintenanceService, runMaintenanceCycle };
