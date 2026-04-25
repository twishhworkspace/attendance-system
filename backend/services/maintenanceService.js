const prisma = require('../db');

/**
 * Unified Maintenance Service
 * 1. Performs Auto-Checkouts for sessions past shift end.
 * 2. Marks missed check-ins as ABSENT after shift end.
 * 3. Handles the "3-Strike" policy.
 */

async function runMaintenanceCycle() {
    console.log('◇ [MAINTENANCE] Starting Strategic Synchronization...');
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const now = new Date();

        const companies = await prisma.company.findMany({
            where: { status: 'ACTIVE' },
            include: { offices: true }
        });

        for (const company of companies) {
            // Find the primary office for end-time (or use default 20:00)
            const primaryOffice = company.offices[0] || { endTime: "20:00" };
            const [endH, endM] = (primaryOffice.endTime || "20:00").split(':').map(Number);
            
            const shiftEnd = new Date();
            shiftEnd.setHours(endH, endM, 0, 0);

            // 1. AUTO-CHECKOUT SWEEP (For people who checked in but didn't check out)
            if (now > shiftEnd) {
                const activeSessions = await prisma.attendance.findMany({
                    where: {
                        companyId: company.id,
                        checkOut: null,
                        checkIn: { gte: today }
                    },
                    include: { user: true }
                });

                for (const session of activeSessions) {
                    const user = session.user;
                    const newForgotCount = user.forgotCheckoutCount + 1;
                    let status = session.status;
                    let notes = session.notes ? session.notes + " | " : "";

                    if (newForgotCount >= 3) {
                        status = "ABSENT";
                        notes += "SYSTEM_TERMINATION: Missed checkout threshold (3/3) reached. Record penalized.";
                    } else {
                        notes += `COMPLIANCE_WARNING: Automatic handshake termination (${newForgotCount}/3).`;
                    }

                    await prisma.$transaction([
                        prisma.attendance.update({
                            where: { id: session.id },
                            data: {
                                checkOut: shiftEnd,
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

                // 2. ABSENT SWEEP (For people who NEVER checked in today)
                const allEmployees = await prisma.user.findMany({
                    where: { companyId: company.id, role: 'EMPLOYEE' }
                });

                const checkedInUserIds = (await prisma.attendance.findMany({
                    where: { companyId: company.id, checkIn: { gte: today } },
                    select: { userId: true }
                })).map(a => a.userId);

                const absentUsers = allEmployees.filter(u => !checkedInUserIds.includes(u.id));

                for (const user of absentUsers) {
                    // Avoid double-creating absent records if the cycle runs multiple times
                    const existingAbsent = await prisma.attendance.findFirst({
                        where: {
                            userId: user.id,
                            checkIn: { gte: today },
                            status: 'ABSENT'
                        }
                    });

                    if (!existingAbsent) {
                        await prisma.attendance.create({
                            data: {
                                userId: user.id,
                                companyId: company.id,
                                checkIn: today,
                                checkOut: today,
                                status: 'ABSENT',
                                notes: 'SYSTEM_GEN: No attendance handshake detected by end of day.'
                            }
                        });
                        console.log(`✓ [MAINTENANCE] Marked user ${user.id} as ABSENT (Company: ${company.name})`);
                    }
                }
            }
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
