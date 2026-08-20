const prisma = require('../db');

/**
 * Standardized audit logging utility
 * @param {Object} params - { companyId, userId, action, details, ip }
 */
const logAction = async ({ companyId, userId, action, details, ip }) => {
  try {
    await prisma.auditLog.create({
      data: {
        companyId,
        userId,
        action,
        details: typeof details === 'object' ? JSON.stringify(details) : String(details),
        ip
      }
    });
  } catch (err) {
    console.error('Audit Logging Failure:', err);
  }
};

module.exports = { logAction };
