const xss = require('xss');
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { logAction } = require('../utils/logger');
const { runMaintenanceCycle } = require('../services/maintenanceService');

const getAttendanceSummary = async (req, res) => {
  try {
    // Perform maintenance sweep (auto-checkout & absent detection) before returning stats
    await runMaintenanceCycle();
    
    const companyId = req.user.companyId;
    const totalEmployees = await prisma.user.count({ where: { role: 'EMPLOYEE', companyId } });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendancesToday = await prisma.attendance.findMany({
      where: { companyId, checkIn: { gte: today } }
    });

    const checkedInCount = attendancesToday.length;
    // Both PRESENT and LATE status mean the employee is physically present/synced
    const presentCount = attendancesToday.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const existingLateCount = attendancesToday.filter(a => a.status === 'LATE').length;
    
    const notCheckedInCount = totalEmployees - checkedInCount;
    
    const now = new Date();
    const isPastMidday = now.getHours() >= 12;

    // Logic: If not checked in, they are LATE before noon, ABSENT after noon.
    const autoLateCount = !isPastMidday ? notCheckedInCount : 0;
    const autoAbsentCount = isPastMidday ? notCheckedInCount : 0;

    res.json({
      totalEmployees,
      presentToday: presentCount,
      lateToday: existingLateCount + autoLateCount,
      absentToday: autoAbsentCount,
      activeSectors: await prisma.sector.count({ where: { companyId } }),
      pendingRequests: await prisma.outLocationRequest.count({ where: { companyId, status: 'PENDING' } }),
      attendanceRate: totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getAllAttendance = async (req, res) => {
  const { range, start, end, userId } = req.query;
  const companyId = req.user.companyId;

  try {
    let startDate = null;
    let endDate = new Date();

    if (range === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'weekly') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === 'monthly') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (range === 'yearly') {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else if (range === 'custom' && start && end) {
      startDate = new Date(start);
      endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
    }

    const where = { companyId };
    if (userId) {
      where.userId = userId;
    }
    if (startDate) {
      where.checkIn = { gte: startDate, lte: endDate };
    }

    const logs = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true, sector: { select: { name: true } } }
        }
      },
      orderBy: { checkIn: 'desc' },
      // increased limit for reports, or removed if range is specified
      take: range ? undefined : 100
    });
    res.json(logs);
  } catch (err) {
    console.error('Audit Fetch Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const addEmployee = async (req, res) => {
  const { name, email, password, sectorId, mobileNumber } = req.body;
  const companyId = req.user.companyId;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const employee = await prisma.user.create({
      data: {
        name: xss(name),
        email: xss(email),
        mobileNumber: mobileNumber ? mobileNumber.replace(/\D/g, '') : null,
        password: hashedPassword,
        role: 'EMPLOYEE',
        companyId,
        sectorId: sectorId || null
      }
    });

    res.status(201).json({ message: 'Employee added successfully', employee: { id: employee.id, name: employee.name, email: employee.email } });
    
    // Log Security Event
    await logAction({
      companyId: req.user.companyId,
      userId: req.user.id,
      action: 'EMPLOYEE_CREATE',
      details: `Added employee: ${xss(name)} (${xss(email)})`,
      ip: req.ip
    });
  } catch (err) {
    if (err.code === 'P2002') {
        return res.status(400).json({ error: 'This email is already registered with another account.' });
    }
    res.status(500).json({ error: 'Failed to add employee' });
  }
};

const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { name, email, sectorId, mobileNumber } = req.body;

  try {
    const updated = await prisma.user.update({
      where: { id, companyId: req.user.companyId },
      data: { 
        name: name ? xss(name) : undefined, 
        email: email ? xss(email) : undefined, 
        mobileNumber: mobileNumber ? mobileNumber.replace(/\D/g, '') : undefined,
        sectorId: sectorId || null 
      }
    });
    res.json(updated);

    // Log Security Event
    await logAction({
      companyId: req.user.companyId,
      userId: req.user.id,
      action: 'EMPLOYEE_UPDATE',
      details: `Updated employee: ${id} (${name})`,
      ip: req.ip
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
};

const deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id, companyId: req.user.companyId } });
    res.json({ message: 'Employee deleted successfully' });

    // Log Security Event
    await logAction({
      companyId: req.user.companyId,
      userId: req.user.id,
      action: 'EMPLOYEE_DELETE',
      details: `Deleted employee ID: ${id}`,
      ip: req.ip
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
};

const resetStrikes = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.update({
      where: { id, companyId: req.user.companyId },
      data: { forgotCheckoutCount: 0 }
    });
    res.json({ message: 'Compliance strikes reset successfully' });

    await logAction({
      companyId: req.user.companyId,
      userId: req.user.id,
      action: 'STRIKE_RESET',
      details: `Reset strikes for employee: ${id}`,
      ip: req.ip
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset strikes' });
  }
};

const resetEmployeePassword = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id, companyId: req.user.companyId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Employee password reset successfully' });

    // Log Security Event
    await logAction({
      companyId: req.user.companyId,
      userId: req.user.id,
      action: 'ADMIN_PASSWORD_RESET',
      details: `Admin reset password for employee ID: ${id}`,
      ip: req.ip
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

const getEmployees = async (req, res) => {
  try {
    const employees = await prisma.user.findMany({
      where: { companyId: req.user.companyId, role: 'EMPLOYEE' },
      select: { id: true, name: true, email: true, mobileNumber: true, createdAt: true, forgotCheckoutCount: true, sector: { select: { name: true } }, sectorId: true }
    });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const totalEmployees = await prisma.user.count({ where: { role: 'EMPLOYEE', companyId } });
    const now = new Date();
    const isPastMidday = now.getHours() >= 12;
    const daysArray = Array.from({ length: 7 }, (_, i) => 6 - i);

    const analyticsData = await Promise.all(daysArray.map(async (i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [present, late, checkedInCount] = await Promise.all([
        prisma.attendance.count({ where: { companyId, status: 'PRESENT', checkIn: { gte: date, lt: nextDate } } }),
        prisma.attendance.count({ where: { companyId, status: 'LATE', checkIn: { gte: date, lt: nextDate } } }),
        prisma.attendance.count({ where: { companyId, checkIn: { gte: date, lt: nextDate } } })
      ]);

      const notCheckedIn = totalEmployees - checkedInCount;
      let finalLate = late;
      let finalAbsent = notCheckedIn;

      // Apply midday logic only for TODAY
      if (i === 0) {
          if (!isPastMidday) {
              finalLate += notCheckedIn;
              finalAbsent = 0;
          }
      }

      return {
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        // For the graph, 'Present' includes both on-time and late employees
        Present: present + late,
        Late: finalLate,
        Absent: finalAbsent
      };
    }));

    const totalPresent = await prisma.attendance.count({ where: { companyId, status: 'PRESENT' } });
    const totalLate = await prisma.attendance.count({ where: { companyId, status: 'LATE' } });
    const totalAbsent = await prisma.attendance.count({ where: { companyId, status: 'ABSENT' } });
    const total = totalPresent + totalLate + totalAbsent;

    const distribution = [
      { name: 'Present', value: total > 0 ? Math.round((totalPresent / total) * 100) : 0 },
      { name: 'Late', value: total > 0 ? Math.round((totalLate / total) * 100) : 0 },
      { name: 'Absent', value: total > 0 ? Math.round((totalAbsent / total) * 100) : 0 }
    ];

    res.json({
      chartData: analyticsData,
      pieData: distribution,
      stats: {
        avgAttendance: total > 0 ? Math.round((totalPresent / total) * 100) : 0,
        lateRate: total > 0 ? Math.round((totalLate / total) * 100) : 0,
        growth: "+12.5%" // Mocked trend
      }
    });
  } catch (err) {
    console.error('Analytics Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const downloadAttendanceReport = async (req, res) => {
  const { range, start, end } = req.query;
  const companyId = req.user.companyId;

  try {
    let startDate = new Date();
    let endDate = new Date();

    if (range === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (range === 'yearly') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else if (range === 'custom' && start && end) {
      startDate = new Date(start);
      endDate = new Date(end);
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        companyId,
        checkIn: { gte: startDate, lte: endDate }
      },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { checkIn: 'desc' }
    });

    // High-Integrity CSV escaping helper
    const escapeCsv = (val) => {
      const s = String(val || '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    let csv = 'Employee,Email,Check In,Check Out,Status,Variance (Minutes),Notes\n';
    attendance.forEach(log => {
      let variance = '--';
      if (log.checkIn && log.checkOut) {
        const diffMs = new Date(log.checkOut) - new Date(log.checkIn);
        variance = Math.round(diffMs / 60000); // Convert to minutes
      }
      
      csv += `${escapeCsv(log.user.name)},${escapeCsv(log.user.email)},${escapeCsv(log.checkIn)},${escapeCsv(log.checkOut || '--')},${escapeCsv(log.status)},${variance},${escapeCsv(log.notes || '')}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${range}.csv`);
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

const updateCompany = async (req, res) => {
  const { name, address } = req.body;
  const companyId = req.user.companyId;

  try {
    const updated = await prisma.company.update({
      where: { id: companyId },
      data: { name, address }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update company profile.' });
  }
};

const createTicket = async (req, res) => {
  const { subject, description, priority } = req.body;
  try {
    const ticket = await prisma.supportTicket.create({
      data: {
        companyId: req.user.companyId,
        userId: req.user.id,
        subject: xss(subject),
        description: xss(description),
        priority: priority || 'NORMAL'
      }
    });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Failed to transmit support ticket.' });
  }
};

const getCompanyTickets = async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { companyId: req.user.companyId },
      include: {
        user: { select: { name: true } },
        replies: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ticket history.' });
  }
};

const getSpatialDensity = async (req, res) => {
  const { range } = req.query;
  const companyId = req.user.companyId;

  try {
    let startDate = null;
    if (range === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const where = { companyId };
    if (startDate) {
      where.checkIn = { gte: startDate };
    }

    const logs = await prisma.attendance.findMany({
      where,
      select: { checkInLocation: true, status: true }
    });

    const densityPoints = logs
      .filter(l => l.checkInLocation && l.checkInLocation.includes(','))
      .map(l => {
        const [lat, lng] = l.checkInLocation.split(',').map(Number);
        return { lat, lng, weight: l.status === 'LATE' ? 0.5 : 1 };
      });

    res.json(densityPoints);
  } catch (err) {
    console.error('Spatial Fetch Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const companyId = req.user.role === 'SUPER_ADMIN' ? undefined : req.user.companyId;
    const logs = await prisma.auditLog.findMany({
      where: companyId ? { companyId } : {},
      orderBy: { createdAt: 'desc' },
      take: 200 // Recent 200 logs
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit trails.' });
  }
};

module.exports = {
  getAttendanceSummary,
  getAllAttendance,
  addEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee,
  getAnalytics,
  downloadAttendanceReport,
  updateCompany,
  createTicket,
  getCompanyTickets,
  getSpatialDensity,
  resetStrikes,
  resetEmployeePassword,
  getAuditLogs
};
