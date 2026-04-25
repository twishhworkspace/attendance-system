const cron = require('node-cron');
const prisma = require('../prisma/client');

/**
 * Initializes automated data retention tasks.
 * Policy: Store data for 3 years, then auto-delete.
 */
const startDataRetentionJob = () => {
    // Schedule: Runs every day at 00:00 (Midnight)
    cron.schedule('0 0 * * *', async () => {
        console.log('[RETENTION] Starting daily data pruning cycle...');
        
        try {
            const threeYearsAgo = new Date();
            threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

            // 1. Prune Attendance Logs
            const attendanceDeleted = await prisma.attendance.deleteMany({
                where: {
                    checkIn: {
                        lt: threeYearsAgo
                    }
                }
            });


            // 3. Prune Out-of-Location Requests
            const requestsDeleted = await prisma.outLocationRequest.deleteMany({
                where: {
                    createdAt: {
                        lt: threeYearsAgo
                    }
                }
            });

            console.log(`[RETENTION] Pruning successful:
                - Attendance Logs: ${attendanceDeleted.count}
                - Location Requests: ${requestsDeleted.count}`);
                
        } catch (error) {
            console.error('[RETENTION] Data pruning failed:', error);
        }
    });

    console.log('[RETENTION] Automated 3-year data retention policy initialized.');
};

module.exports = { startDataRetentionJob };
