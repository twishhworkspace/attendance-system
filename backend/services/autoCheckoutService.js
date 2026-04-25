const prisma = require('../db');

const runAutoCheckout = async () => {
    console.log('◇ Running Handshake Maintenance Cycle...');
    try {
        // Find attendance records with no checkout older than 9 hours
        const nineHoursAgo = new Date(Date.now() - 9 * 60 * 60 * 1000);
        
        const overdue = await prisma.attendance.findMany({
            where: {
                checkOut: null,
                checkIn: { lt: nineHoursAgo }
            }
        });

        if (overdue.length === 0) {
            console.log('◇ All handshakes compliant.');
            return;
        }

        console.log(`◇ Identified ${overdue.length} orphaned sessions. Initiating Auto-Termination...`);

        for (const record of overdue) {
            const autoTime = new Date(record.checkIn.getTime() + 9 * 60 * 60 * 1000);
            
            await prisma.$transaction([
                prisma.attendance.update({
                    where: { id: record.id },
                    data: {
                        checkOut: autoTime,
                        isAutoCheckout: true,
                        notes: (record.notes ? record.notes + ' | ' : '') + 'Handshake Auto-Timed Out (9hr Shift)'
                    }
                }),
                prisma.user.update({
                    where: { id: record.userId },
                    data: {
                        forgotCheckoutCount: { increment: 1 }
                    }
                })
            ]);
            console.log(`✓ Auto-terminated session ${record.id} for user ${record.userId}`);
        }
    } catch (err) {
        console.error('⨯ Handshake Maintenance Failure:', err);
    }
};

const startAutoCheckoutService = () => {
    // Run every 30 minutes
    setInterval(runAutoCheckout, 30 * 60 * 1000);
    // Also run once on startup
    runAutoCheckout();
};

module.exports = { startAutoCheckoutService };
