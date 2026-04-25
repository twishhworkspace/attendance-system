const xss = require('xss');
const prisma = require('../db');

const submitRequest = async (req, res) => {
  const { reason, location } = req.body;
  const userId = req.user.id;

  try {
    const request = await prisma.outLocationRequest.create({
      data: {
        userId,
        companyId: req.user.companyId,
        reason: xss(reason),
        location,
        status: 'PENDING'
      }
    });

    res.json(request);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getMyRequests = async (req, res) => {
  const userId = req.user.id;
  try {
    const requests = await prisma.outLocationRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getPendingRequests = async (req, res) => {
  const { status } = req.query; // Optional: PENDING, APPROVED, REJECTED
  try {
    let where = req.user.role === 'SUPER_ADMIN' ? {} : { companyId: req.user.companyId };
    
    if (status) {
      if (status.includes(',')) {
        where.status = { in: status.split(',') };
      } else {
        where.status = status;
      }
    }

    const requests = await prisma.outLocationRequest.findMany({
      where,
      include: { user: { select: { name: true, email: true, sector: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const processRequest = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  
  try {
    const whereClause = req.user.role === 'SUPER_ADMIN' ? { id } : { id, companyId: req.user.companyId };
    const request = await prisma.outLocationRequest.findUnique({
      where: whereClause
    });

    if (!request) {
      console.log(`[SECURITY] IDOR ATTEMPT DETECTED - User ${req.user.id} tried to access request ${id}`);
      return res.status(404).json({ error: 'Request not found or access denied.' });
    }

    const isApprove = action === 'APPROVE' || action === 'APPROVED';
    const newStatus = isApprove ? 'APPROVED' : 'REJECTED';
    const attendanceStatus = isApprove ? 'PRESENT' : 'ABSENT';

    await prisma.outLocationRequest.update({
      where: { id },
      data: { status: newStatus }
    });

    const today = new Date(request.createdAt);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId: request.userId,
        checkIn: { gte: today, lt: tomorrow }
      }
    });

    if (existingAttendance) {
      await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: { status: attendanceStatus, notes: `Out-of-location: ${request.reason}` }
      });
    } else {
      await prisma.attendance.create({
        data: {
          userId: request.userId,
          companyId: request.companyId,
          checkIn: request.createdAt,
          status: attendanceStatus,
          notes: `Out-of-location: ${request.reason}`,
          checkInLocation: request.location
        }
      });
    }

    res.json({ message: `Request ${newStatus.toLowerCase()} successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { submitRequest, getMyRequests, getPendingRequests, processRequest };
