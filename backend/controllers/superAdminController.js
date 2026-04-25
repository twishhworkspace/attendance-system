const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const xss = require('xss');
const prisma = require('../db');

const getGlobalStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [companyCount, userCount, activeSessions, heatmapData] = await Promise.all([
      prisma.company.count(),
      prisma.user.count({ where: { role: { not: 'SUPER_ADMIN' } } }),
      prisma.attendance.count({ where: { checkOut: null, checkIn: { gte: today } } }),
      prisma.attendance.findMany({
        where: { checkIn: { gte: today } },
        select: { checkInLocation: true }
      })
    ]);

    // Format Heatmap Data: Filter nulls and convert to coordinate pairs
    const coordinates = heatmapData
      .filter(a => a.checkInLocation)
      .map(a => {
        const [lat, lng] = a.checkInLocation.split(',').map(s => parseFloat(s.trim()));
        return { lat, lng };
      });

    res.json({
      companies: companyCount,
      users: userCount,
      activeSessions,
      heatmap: coordinates,
      efficiency: "94.2%",
      uptime: "99.9%"
    });
  } catch (err) {
    console.error('Master Stats Error:', err);
    res.status(500).json({ error: 'Failed to fetch platform telemetry' });
  }
};

const getAllCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: { users: true, attendances: true }
        },
        users: {
          where: { role: 'COMPANY_ADMIN' },
          select: { name: true, email: true },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = companies.map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
      createdAt: c.createdAt,
      employeeCount: c._count.users,
      logCount: c._count.attendances,
      admin: c.users[0] || { name: 'UNSET', email: 'UNSET' }
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Master Company Fetch Error:', err);
    res.status(500).json({ error: 'Failed to fetch company registry' });
  }
};

const updateCompanyAdminPassword = async (req, res) => {
  const { companyId } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    const admin = await prisma.user.findFirst({
      where: { companyId, role: 'COMPANY_ADMIN' }
    });

    if (!admin) {
      return res.status(404).json({ error: 'Primary admin node not found for this company.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Administrative password override successful.' });
  } catch (err) {
    console.error('Admin Password Reset Error:', err);
    res.status(500).json({ error: 'Failed to override admin password.' });
  }
};

const deleteCompany = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.company.delete({ where: { id } });
    res.json({ message: 'Company and all associated data decommissioned successfully.' });
  } catch (err) {
    console.error('Company Decommission Error:', err);
    res.status(500).json({ error: 'Failed to decommission company. Check for active logical locks.' });
  }
};

const updateCompany = async (req, res) => {
  const { id } = req.params;
  const { name, status } = req.body;

  try {
    const updated = await prisma.company.update({
      where: { id },
      data: {
        ...(name && { name: xss(name) }),
        ...(status && { status })
      }
    });

    res.json({ message: 'Company identity parameters synchronized.', company: updated });
  } catch (err) {
    console.error('Company Update Error:', err);
    res.status(500).json({ error: 'Failed to update company registry.' });
  }
};

const toggleCompanyStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) return res.status(404).json({ error: 'Strategic node not found.' });

    const newStatus = company.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await prisma.company.update({
      where: { id },
      data: { status: newStatus }
    });

    res.json({ message: `Sector status updated to ${newStatus}`, status: newStatus });
  } catch (err) {
    console.error('Toggle Status Error:', err);
    res.status(500).json({ error: 'Failed to toggle cluster accessibility.' });
  }
};


// BROADCAST SYSTEMS
const createBroadcast = async (req, res) => {
  const { type, message } = req.body;
  try {
    const broadcast = await prisma.systemBroadcast.create({
      data: { type, message: xss(message) }
    });
    res.json(broadcast);
  } catch (err) {
    res.status(500).json({ error: 'Failed to deploy global broadcast.' });
  }
};

const getBroadcasts = async (req, res) => {
  try {
    const broadcasts = await prisma.systemBroadcast.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(broadcasts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch broadcast history.' });
  }
};

const toggleBroadcast = async (req, res) => {
  const { id } = req.params;
  try {
    const b = await prisma.systemBroadcast.findUnique({ where: { id } });
    if (!b) return res.status(404).json({ error: 'Broadcast node not found.' });
    const updated = await prisma.systemBroadcast.update({
      where: { id },
      data: { active: !b.active }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle broadcast status.' });
  }
};

// SUPPORT HUB SYSTEMS
const getGlobalTickets = async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      include: {
        company: { select: { name: true } },
        user: { select: { name: true, email: true } },
        _count: { select: { replies: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch support registry.' });
  }
};

const replyToTicket = async (req, res) => {
  const { ticketId } = req.params;
  const { message } = req.body;
  try {
    const reply = await prisma.ticketReply.create({
      data: {
        ticketId,
        userId: req.user.id,
        message: xss(message),
        isAdmin: true
      }
    });
    res.json(reply);
  } catch (err) {
    res.status(500).json({ error: 'Failed to transmit ticket response.' });
  }
};

// DATA ARCHIVAL SYSTEMS
const runArchivalProtocol = async (req, res) => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const oldLogs = await prisma.attendance.findMany({
      where: { createdAt: { lt: oneYearAgo } }
    });

    if (oldLogs.length === 0) {
      return res.json({ message: 'No records found matching archival criteria.' });
    }

    // Move to ArchiveAttendance
    const archiveData = oldLogs.map(log => ({
      id: log.id,
      companyId: log.companyId,
      userId: log.userId,
      checkIn: log.checkIn,
      checkOut: log.checkOut,
      checkInLocation: log.checkInLocation,
      checkOutLocation: log.checkOutLocation,
      status: log.status,
      notes: log.notes
    }));

    await prisma.$transaction([
      prisma.archivedAttendance.createMany({ data: archiveData }),
      prisma.attendance.deleteMany({ where: { id: { in: oldLogs.map(l => l.id) } } })
    ]);

    res.json({ message: `Successfully archived ${oldLogs.length} attendance records.` });
  } catch (err) {
    console.error('Archival Error:', err);
    res.status(500).json({ error: 'Archival protocol failed.' });
  }
};

const getGlobalLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit telemetry.' });
  }
};

module.exports = {
  getGlobalStats,
  getAllCompanies,
  updateCompanyAdminPassword,
  updateCompany,
  deleteCompany,
  toggleCompanyStatus,
  createBroadcast,
  getBroadcasts,
  toggleBroadcast,
  getGlobalTickets,
  replyToTicket,
  runArchivalProtocol,
  getGlobalLogs
};
