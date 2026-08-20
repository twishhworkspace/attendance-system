const logAction = async ({ companyId, userId, action, details, ip }) => {
    // Console logging for security monitoring (No DB dependency)
    console.log(`[SECURITY_LOG] ${new Date().toISOString()} | Action: ${action} | User: ${userId} | Details: ${details} | IP: ${ip}`);
};

module.exports = { logAction };
