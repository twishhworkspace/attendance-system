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

    const coordinates = heatmapData
      .filter(a => a.checkInLocation)
      .map(a => {
        const coords = a.checkInLocation.split(',').map(s => parseFloat(s.trim()));
        return { lat: coords[0], lng: coords[1] };
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
    res.status(500).json({ error: 'Failed to fetch platform telemetry' });
  }
};

const getAllCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: { select: { users: true, attendances: true } },
        users: { where: { role: 'COMPANY_ADMIN' }, select: { name: true, email: true }, take: 1 }
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
    res.status(500).json({ error: 'Failed to fetch company registry' });
  }
};

const updateCompanyAdminPassword = async (req, res) => {
  const { companyId } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  try {
    const admin = await prisma.user.findFirst({ where: { companyId, role: 'COMPANY_ADMIN' } });
    if (!admin) return res.status(404).json({ error: 'Primary admin node not found.' });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: admin.id }, data: { password: hashedPassword } });
    res.json({ message: 'Administrative password override successful.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to override password.' });
  }
};

const deleteCompany = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.company.delete({ where: { id } });
    res.json({ message: 'Company decommissioned successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to decommission company.' });
  }
};

const updateCompany = async (req, res) => {
  const { id } = req.params;
  const { name, status } = req.body;
  try {
    const updated = await prisma.company.update({
      where: { id },
      data: { ...(name && { name: xss(name) }), ...(status && { status }) }
    });
    res.json({ message: 'Company synchronized.', company: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update company.' });
  }
};

const toggleCompanyStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) return res.status(404).json({ error: 'Strategic node not found.' });
    const newStatus = company.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await prisma.company.update({ where: { id }, data: { status: newStatus } });
    res.json({ message: `Status updated to ${newStatus}`, status: newStatus });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle status.' });
  }
};

const createBroadcast = async (req, res) => {
  const { type, message } = req.body;
  try {
    const broadcast = await prisma.systemBroadcast.create({ data: { type, message: xss(message) } });
    res.json(broadcast);
  } catch (err) {
    res.status(500).json({ error: 'Failed to deploy broadcast.' });
  }
};

const getBroadcasts = async (req, res) => {
  try {
    const broadcasts = await prisma.systemBroadcast.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(broadcasts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch broadcasts.' });
  }
};

const toggleBroadcast = async (req, res) => {
  const { id } = req.params;
  try {
    const b = await prisma.systemBroadcast.findUnique({ where: { id } });
    if (!b) return res.status(404).json({ error: 'Broadcast node not found.' });
    const updated = await prisma.systemBroadcast.update({ where: { id }, data: { active: !b.active } });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle broadcast.' });
  }
};

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
    res.status(500).json({ error: 'Failed to fetch tickets.' });
  }
};

const replyToTicket = async (req, res) => {
  const { ticketId } = req.params;
  const { message } = req.body;
  try {
    const reply = await prisma.ticketReply.create({
      data: { ticketId, userId: req.user.id, message: xss(message), isAdmin: true }
    });
    res.json(reply);
  } catch (err) {
    res.status(500).json({ error: 'Failed to transmit reply.' });
  }
};

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
    res.status(500).json({ error: 'Archival protocol failed.' });
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
  runArchivalProtocol
};
