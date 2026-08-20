const prisma = require('../db');

/**
 * Performs auto-checkout for all employees who missed their end-of-shift checkout.
 */
async function processAutoCheckouts() {
    console.log('[AUTO-CHECKOUT] Starting scan...');
    
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find all active attendances that haven't been checked out
        const activeAttendances = await prisma.attendance.findMany({
            where: {
                checkOut: null,
                checkIn: { gte: today }
            },
            include: {
                user: true
            }
        });

        // We need the office end times. 
        // For simplicity, we'll use the user's assigned office or the company default.
        // Actually, let's fetch offices too.
        const offices = await prisma.office.findMany();
        
        for (const attendance of activeAttendances) {
            const user = attendance.user;
            // Find office (if user has sector, sector -> office? No, Sector doesn't link to office in schema)
            // Wait, schema has User -> Sector, and Office is separate.
            // Let's assume the first office of the company for now, or just use 8 PM (20:00) as default.
            const userOffice = offices.find(o => o.companyId === user.companyId) || { endTime: "20:00" };
            
            const [endHour, endMin] = userOffice.endTime.split(':').map(Number);
            const shiftEnd = new Date();
            shiftEnd.setHours(endHour, endMin, 0, 0);

            if (new Date() > shiftEnd) {
                console.log(`[AUTO-CHECKOUT] Processing User: ${user.name}`);
                
                const newForgotCount = user.forgotCheckoutCount + 1;
                let status = attendance.status;
                let notes = attendance.notes ? attendance.notes + " | " : "";
                
                if (newForgotCount > 3) {
                    status = "ABSENT";
                    notes += "Auto-checkout (Strike 3+): Marked as Absent.";
                } else {
                    notes += `Auto-checkout (Warning ${newForgotCount}/3).`;
                }

                await prisma.$transaction([
                    prisma.attendance.update({
                        where: { id: attendance.id },
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
            }
        }
        
        console.log('[AUTO-CHECKOUT] Scan complete.');
    } catch (err) {
        console.error('[AUTO-CHECKOUT] Error:', err);
    }
}

module.exports = { processAutoCheckouts };
