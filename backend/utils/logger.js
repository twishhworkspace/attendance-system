const prisma = require('../prisma/client');

/**
 * Logs a sensitive administrative or security action to the database.
 * @param {Object} data - { companyId, userId, action, details, ip }
 */
const logAction = async ({ companyId, userId, action, details, ip }) => {
    try {
        await prisma.auditLog.create({
            data: {
                companyId: companyId || null,
                userId: userId || null,
                action,
                details: typeof details === 'string' ? details : JSON.stringify(details),
                ip: ip || null
            }
        });
    } catch (err) {
        console.error('Failed to write to AuditLog:', err);
    }
};

module.exports = { logAction };
