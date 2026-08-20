const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    log: [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
    ],
});

prisma.$on('error', (e) => {
    // Suppress serverless idle connection reset messages to avoid console clutter
    if (e.message && e.message.includes('terminating connection due to administrator command')) {
        return;
    }
    console.error(`[Prisma Error] ${e.message}`);
});

prisma.$on('warn', (e) => {
    console.warn(`[Prisma Warning] ${e.message}`);
});

module.exports = prisma;
