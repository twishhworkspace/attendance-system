const xss = require('xss');
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { runMaintenanceCycle } = require('../services/maintenanceService');

const getAttendanceSummary = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const totalEmployees = await prisma.user.count({ where: { role: 'EMPLOYEE', companyId } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendancesToday = await prisma.attendance.findMany({
      where: { companyId, checkIn: { gte: today } },
      select: { userId: true, status: true }
    });

    const uniqueUserIds = new Set(attendancesToday.map(a => a.userId));
    const checkedInCount = uniqueUserIds.size;
    
    // Group by user to avoid overcounting PRESENT/LATE if they have multiple records
    const userBestStatus = {};
    attendancesToday.forEach(a => {
        if (!userBestStatus[a.userId] || (a.status === 'PRESENT' && userBestStatus[a.userId] !== 'PRESENT')) {
            userBestStatus[a.userId] = a.status;
        }
    });

    const presentCount = Object.values(userBestStatus).filter(s => s === 'PRESENT' || s === 'LATE').length;
    const leaveCount = Object.values(userBestStatus).filter(s => s === 'LEAVE').length;
    const actualLateCount = Object.values(userBestStatus).filter(s => s === 'LATE').length;
    
    // Anyone not present and not on leave is absent
    const absentCount = Math.max(0, totalEmployees - presentCount - leaveCount);

    res.json({
      totalEmployees,
      presentToday: presentCount,
      onLeaveToday: leaveCount,
      lateToday: actualLateCount,
      absentToday: absentCount,
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

    const where = req.user.role === 'SUPER_ADMIN' ? {} : { companyId: req.user.companyId };
    if (userId) where.userId = userId;
    if (startDate) where.checkIn = { gte: startDate, lte: endDate };

    const logs = await prisma.attendance.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, weeklyOff: true, sector: { select: { name: true } } } }
      },
      orderBy: { checkIn: 'desc' },
      take: range ? undefined : 100
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const addEmployee = async (req, res) => {
  const { name, email, password, sectorId, mobileNumber, weeklyOff, expenseEnabled } = req.body;
  const companyId = req.user.companyId;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const employee = await prisma.user.create({
      data: {
        name: xss(name),
        email: xss(email),
        mobileNumber: mobileNumber ? mobileNumber.replace(/\D/g, '') : null,
        password: hashedPassword,
        role: 'EMPLOYEE',
        companyId,
        sectorId: sectorId || null,
        weeklyOff: weeklyOff || 'Sunday',
        expenseEnabled: Boolean(expenseEnabled)
      }
    });
    res.status(201).json({ message: 'Employee added successfully', employee: { id: employee.id, name: employee.name, email: employee.email } });
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'This email is already registered.' });
    res.status(500).json({ error: 'Failed to add employee' });
  }
};

const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { name, email, sectorId, mobileNumber, weeklyOff, expenseEnabled } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id, companyId: req.user.companyId },
      data: { 
        name: name ? xss(name) : undefined, 
        email: email ? xss(email) : undefined, 
        mobileNumber: mobileNumber ? mobileNumber.replace(/\D/g, '') : undefined,
        sectorId: sectorId || null,
        weeklyOff: weeklyOff !== undefined ? weeklyOff : undefined,
        expenseEnabled: expenseEnabled !== undefined ? Boolean(expenseEnabled) : undefined
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
};

const deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id, companyId: req.user.companyId } });
    res.json({ message: 'Employee deleted successfully' });
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
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset strikes' });
  }
};

const resetEmployeePassword = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id, companyId: req.user.companyId },
      data: { password: hashedPassword }
    });
    res.json({ message: 'Employee password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

const getEmployees = async (req, res) => {
  try {
    const where = req.user.role === 'SUPER_ADMIN' ? { role: 'EMPLOYEE' } : { companyId: req.user.companyId, role: 'EMPLOYEE' };
    const employees = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, mobileNumber: true, createdAt: true, forgotCheckoutCount: true, sector: { select: { name: true } }, sectorId: true, weeklyOff: true }
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
    
    // Timezone-aware midday check (assuming IST +5:30 for user context)
    const now = new Date();
    const utcHours = now.getUTCHours();
    const istHours = (utcHours + 5.5) % 24;
    const isPastMidday = istHours >= 12;

    const daysArray = Array.from({ length: 7 }, (_, i) => 6 - i);

    const analyticsData = await Promise.all(daysArray.map(async (i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dailyLogs = await prisma.attendance.findMany({
        where: { companyId, checkIn: { gte: date, lt: nextDate } },
        select: { userId: true, status: true }
      });

      const uniqueUserStatus = {};
      dailyLogs.forEach(l => {
        if (!uniqueUserStatus[l.userId] || (l.status === 'PRESENT' && uniqueUserStatus[l.userId] !== 'PRESENT')) {
            uniqueUserStatus[l.userId] = l.status;
        }
      });

      const present = Object.values(uniqueUserStatus).filter(s => s === 'PRESENT').length;
      const late = Object.values(uniqueUserStatus).filter(s => s === 'LATE').length;
      const onLeave = Object.values(uniqueUserStatus).filter(s => s === 'LEAVE').length;
      const checkedInCount = Object.keys(uniqueUserStatus).length;

      const notCheckedIn = Math.max(0, totalEmployees - checkedInCount);
      let finalLate = late;
      let finalAbsent = notCheckedIn;
      if (i === 0 && !isPastMidday) {
        finalLate += notCheckedIn;
        finalAbsent = 0;
      }

      return {
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        Present: present + late,
        Late: finalLate,
        Absent: finalAbsent,
        Leave: onLeave
      };
    }));

    // Real-time Distribution for Pie Chart (Match getAttendanceSummary logic)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayAttendances = await prisma.attendance.findMany({
      where: { companyId, checkIn: { gte: todayStart } },
      select: { userId: true, status: true }
    });

    const userBestStatus = {};
    todayAttendances.forEach(a => {
        if (!userBestStatus[a.userId] || (a.status === 'PRESENT' && userBestStatus[a.userId] !== 'PRESENT')) {
            userBestStatus[a.userId] = a.status;
        }
    });

    const rtPresent = Object.values(userBestStatus).filter(s => s === 'PRESENT' || s === 'LATE').length;
    const rtLeave = Object.values(userBestStatus).filter(s => s === 'LEAVE').length;
    const rtAbsent = Math.max(0, totalEmployees - rtPresent - rtLeave);

    res.json({
      chartData: analyticsData,
      pieData: [
        { name: 'Present', value: totalEmployees > 0 ? Math.round((rtPresent / totalEmployees) * 100) : 0 },
        { name: 'Absent', value: totalEmployees > 0 ? Math.round((rtAbsent / totalEmployees) * 100) : 0 },
        { name: 'Leave', value: totalEmployees > 0 ? Math.round((rtLeave / totalEmployees) * 100) : 0 }
      ],
      stats: {
        avgAttendance: totalEmployees > 0 ? Math.round((rtPresent / totalEmployees) * 100) : 0,
        lateRate: 0,
        growth: "+12.5%"
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const downloadAttendanceReport = async (req, res) => {
  const { range, start, end } = req.query;
  const companyId = req.user.companyId;
  try {
    let startDate = new Date();
    let endDate = new Date();
    if (range === 'weekly') startDate.setDate(startDate.getDate() - 7);
    else if (range === 'monthly') startDate.setMonth(startDate.getMonth() - 1);
    else if (range === 'yearly') startDate.setFullYear(startDate.getFullYear() - 1);
    else if (range === 'custom' && start && end) {
      startDate = new Date(start);
      endDate = new Date(end);
    }

    const attendance = await prisma.attendance.findMany({
      where: { companyId, checkIn: { gte: startDate, lte: endDate } },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { checkIn: 'desc' }
    });

    const escapeCsv = (val) => {
      const s = String(val || '');
      return (s.includes(',') || s.includes('"') || s.includes('\n')) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const formatDate = (date) => {
      if (!date) return '--';
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    let csv = 'Employee,Email,Check In Date,Check In Time,Check Out Time,Status,Variance (Minutes),Notes\n';
    attendance.forEach(log => {
      let variance = '--';
      if (log.checkIn && log.checkOut && !log.isAutoCheckout) {
        variance = Math.round((new Date(log.checkOut) - new Date(log.checkIn)) / 60000);
      }
      let finalNotes = log.isAutoCheckout ? 'Auto checked out' : (log.notes || '');
      const checkInTime = log.checkIn ? new Date(log.checkIn).toLocaleTimeString('en-GB') : '--';
      const checkOutTime = log.checkOut && !log.isAutoCheckout ? new Date(log.checkOut).toLocaleTimeString('en-GB') : '--';
      csv += `${escapeCsv(log.user.name)},${escapeCsv(log.user.email)},${escapeCsv(formatDate(log.checkIn))},${escapeCsv(checkInTime)},${escapeCsv(checkOutTime)},${escapeCsv(log.status)},${variance},${escapeCsv(finalNotes)}\n`;
    });

    const safeRange = (range || 'custom').replace(/[^a-z0-9_-]/gi, '_');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_report_${safeRange}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

const updateCompany = async (req, res) => {
  const { name, address } = req.body;
  try {
    const updated = await prisma.company.update({
      where: { id: req.user.companyId },
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
        replies: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tickets.' });
  }
};

const getSpatialDensity = async (req, res) => {
  const { range } = req.query;
  try {
    let startDate = null;
    if (range === 'today') { startDate = new Date(); startDate.setHours(0, 0, 0, 0); }
    else if (range === 'week') { startDate = new Date(); startDate.setDate(startDate.getDate() - 7); }
    else if (range === 'month') { startDate = new Date(); startDate.setMonth(startDate.getMonth() - 1); }

    const logs = await prisma.attendance.findMany({
      where: { companyId: req.user.companyId, ...(startDate ? { checkIn: { gte: startDate } } : {}) },
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
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getStatusEmployees = async (req, res) => {
  const { status } = req.params;
  const companyId = req.user.companyId;

  try {
    const totalEmployees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE', companyId },
      select: { id: true, name: true, sector: { select: { name: true } } }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendancesToday = await prisma.attendance.findMany({
      where: { companyId, checkIn: { gte: today } },
      select: { userId: true, status: true }
    });

    const userBestStatus = {};
    attendancesToday.forEach(a => {
      if (!userBestStatus[a.userId] || (a.status === 'PRESENT' && userBestStatus[a.userId] !== 'PRESENT')) {
        userBestStatus[a.userId] = a.status;
      }
    });

    const now = new Date();
    const istHours = (now.getUTCHours() + 5.5) % 24;
    const isPastMidday = istHours >= 12;

    const filtered = totalEmployees.filter(emp => {
      const currentStatus = userBestStatus[emp.id];
      
      if (status.toUpperCase() === 'PRESENT') return currentStatus === 'PRESENT' || currentStatus === 'LATE';
      if (status.toUpperCase() === 'LATE') {
          if (currentStatus === 'LATE') return true;
          if (!currentStatus && !isPastMidday) return true; // Auto-late
          return false;
      }
      if (status.toUpperCase() === 'ABSENT') {
          return !currentStatus && isPastMidday; // Auto-absent
      }
      if (status.toUpperCase() === 'LEAVE') return currentStatus === 'LEAVE';
      
      return false;
    });

    res.json(filtered.map(f => ({
        id: f.id,
        name: f.name,
        sector: f.sector?.name || 'N/A'
    })));
  } catch (err) {
    console.error('Status Employees Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getAttendanceSummary,
  getAllAttendance,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployees,
  getAnalytics,
  downloadAttendanceReport,
  updateCompany,
  createTicket,
  getCompanyTickets,
  getSpatialDensity,
  resetStrikes,
  resetEmployeePassword,
  getStatusEmployees
};
