const prisma = require('../db');
const { logAction } = require('../utils/logger');

const getNotices = async (req, res) => {
    try {
        const notices = await prisma.companyNotice.findMany({
            where: { 
                companyId: req.user.companyId,
                active: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notices);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch notice board.' });
    }
};

const createNotice = async (req, res) => {
    const { title, message, type, scheduledDate } = req.body;
    try {
        const notice = await prisma.companyNotice.create({
            data: {
                companyId: req.user.companyId,
                title,
                message,
                type: type || 'NOTICE',
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null
            }
        });

        await logAction({
            companyId: req.user.companyId,
            userId: req.user.id,
            action: 'NOTICE_CREATED',
            details: `New ${type} issued: ${title}`,
            ip: req.ip
        });

        res.json(notice);
    } catch (err) {
        res.status(500).json({ error: 'Failed to deploy notice.' });
    }
};

const deleteNotice = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.companyNotice.delete({
            where: { 
                id,
                companyId: req.user.companyId
            }
        });
        res.json({ message: 'Notice retracted.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to retract notice.' });
    }
};

module.exports = {
    getNotices,
    createNotice,
    deleteNotice
};
