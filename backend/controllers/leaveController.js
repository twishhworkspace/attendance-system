const xss = require('xss');
const prisma = require('../db');

const submitLeaveRequest = async (req, res) => {
  const { startDate, endDate, reason } = req.body;
  const userId = req.user.id;

  if (!startDate || !endDate || !reason) {
    return res.status(400).json({ error: 'Start date, end date, and reason are required.' });
  }

  try {
    const request = await prisma.leaveRequest.create({
      data: {
        userId,
        companyId: req.user.companyId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason: xss(reason),
        status: 'PENDING'
      }
    });

    res.json(request);
  } catch (err) {
    console.error('[LEAVE_CONTROLLER] Submit Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getMyLeaveRequests = async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;
  try {
    let where = { userId };
    if (status) {
      if (status.includes(',')) {
        where.status = { in: status.split(',') };
      } else {
        where.status = status;
      }
    }

    const requests = await prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getAllLeaveRequests = async (req, res) => {
  const { status } = req.query;
  try {
    let where = req.user.role === 'SUPER_ADMIN' ? {} : { companyId: req.user.companyId };
    
    if (status) {
      if (status.includes(',')) {
        where.status = { in: status.split(',') };
      } else {
        where.status = status;
      }
    }

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: { user: { select: { name: true, email: true, sector: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const processLeaveRequest = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // APPROVE or REJECT
  
  try {
    const whereClause = req.user.role === 'SUPER_ADMIN' ? { id } : { id, companyId: req.user.companyId };
    const request = await prisma.leaveRequest.findUnique({
      where: whereClause
    });

    if (!request) {
      return res.status(404).json({ error: 'Leave request not found or access denied.' });
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    await prisma.leaveRequest.update({
      where: { id },
      data: { status: newStatus }
    });

    // If approved, create attendance records for the leave period
    if (newStatus === 'APPROVED') {
      const start = new Date(request.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(request.endDate);
      end.setHours(0, 0, 0, 0);
      
      let current = new Date(start);
      while (current <= end) {
        // Check if attendance already exists for this day to avoid duplicates
        const dayStart = new Date(current);
        const dayEnd = new Date(current);
        dayEnd.setHours(23, 59, 59, 999);

        const existing = await prisma.attendance.findFirst({
          where: {
            userId: request.userId,
            checkIn: { gte: dayStart, lte: dayEnd }
          }
        });

        if (!existing) {
          await prisma.attendance.create({
            data: {
              userId: request.userId,
              companyId: request.companyId,
              checkIn: new Date(current),
              status: 'LEAVE',
              notes: `Approved Leave: ${request.reason}`
            }
          });
        } else {
          // Update existing status if it was ABSENT or something else
          await prisma.attendance.update({
            where: { id: existing.id },
            data: { 
              status: 'LEAVE', 
              notes: existing.notes ? `${existing.notes} | Approved Leave: ${request.reason}` : `Approved Leave: ${request.reason}`
            }
          });
        }
        current.setDate(current.getDate() + 1);
      }
    }

    res.json({ message: `Leave request ${newStatus.toLowerCase()} successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { submitLeaveRequest, getMyLeaveRequests, getAllLeaveRequests, processLeaveRequest };
