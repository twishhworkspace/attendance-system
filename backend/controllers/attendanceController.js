const prisma = require('../db');
const { isWithinRange } = require('../utils/geofencing');
const { logAction } = require('../utils/logger');
const { getAttendanceDayStart, IST_OFFSET } = require('../utils/timezone');

const checkIn = async (req, res) => {
  const { location, accuracy, ip, photoUrl, offlineTimestamp } = req.body || {};
  const userId = req.user.id;

  try {
    const punchTime = offlineTimestamp ? new Date(offlineTimestamp) : new Date();
    const attendanceDayStart = getAttendanceDayStart(punchTime);

    // 1. Guard against active sessions (ensure check-out before checking in again)
    const activeSession = await prisma.attendance.findFirst({
      where: {
        userId,
        checkOut: null
      }
    });

    if (activeSession) {
      return res.status(400).json({ error: 'Active check-in session already exists. Please check out first.' });
    }

    // 2. Prevent multiple check-ins on the same attendance day
    const existing = await prisma.attendance.findFirst({
      where: {
        userId,
        checkIn: { gte: attendanceDayStart }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    // Geofencing & Office Timing Check
    const offices = await prisma.office.findMany({ where: { companyId: req.user.companyId } });
    if (offices.length === 0) {
        return res.status(403).json({ error: 'Verification failed due to location not defined, contact admin' });
    }
    
    // Find the specific office the user is in to get its startTime
    const { inRange, lowPrecision } = isWithinRange(location, offices, accuracy);
    
    if (lowPrecision) {
      return res.status(403).json({ error: 'Tactical Signal Interference: GPS accuracy too low. Please move to an open area and retry.' });
    }

    if (!inRange) {
      return res.status(403).json({ error: 'Spatial Violation: You are outside the authorized office zone (100m).' });
    }

    // Status Determination (PRESENT vs LATE)
    let status = 'PRESENT';

    // Timezone-aware 10:00 AM IST calculation on the attendance day
    const istTime = attendanceDayStart.getTime() + IST_OFFSET;
    const istDate = new Date(istTime);
    istDate.setUTCHours(10, 0, 0, 0);
    const tenAM = new Date(istDate.getTime() - IST_OFFSET);

    if (punchTime > tenAM) {
        status = 'LATE';
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        companyId: req.user.companyId,
        checkIn: punchTime,
        checkInLocation: location,
        checkInAccuracy: accuracy ? parseFloat(accuracy) : null,
        checkInIp: req.ip,
        photoUrl,
        status: status
      }
    });

    res.json(attendance);

    // Log Security Event for Forensic Analysis
    await logAction({
      companyId: req.user.companyId,
      userId,
      action: 'ATTENDANCE_CHECKIN',
      details: `Coordinates: ${location} | Accuracy: ${accuracy || 'N/A'}m${offlineTimestamp ? ' | Offline' : ''}`,
      ip: req.ip
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const checkOut = async (req, res) => {
  const { location, accuracy, offlineTimestamp } = req.body || {};
  const userId = req.user.id;

  try {
    const punchTime = offlineTimestamp ? new Date(offlineTimestamp) : new Date();

    // Query for the latest active session (no date constraint to support night shift crossings)
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        checkOut: null
      },
      orderBy: { checkIn: 'desc' }
    });

    if (!attendance) {
      return res.status(400).json({ error: 'No active check-in found' });
    }

    // Geofencing Check
    const offices = await prisma.office.findMany({ where: { companyId: req.user.companyId } });
    if (offices.length === 0) {
        return res.status(403).json({ error: 'Verification failed due to location not defined, contact admin' });
    }
    const { inRange, lowPrecision } = isWithinRange(location, offices, accuracy);

    if (lowPrecision) {
      return res.status(403).json({ error: 'Tactical Signal Interference: GPS accuracy too low. Policy requires high-precision sessions.' });
    }

    if (!inRange) {
      return res.status(403).json({ error: 'Spatial Violation: You are outside the authorized office zone (100m).' });
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: punchTime,
        checkOutLocation: location,
        checkOutAccuracy: accuracy ? parseFloat(accuracy) : null
      }
    });

    // Temporal Integrity Verification
    if (updated.checkOut < updated.checkIn) {
        await prisma.attendance.update({
            where: { id: updated.id },
            data: { checkOut: new Date(updated.checkIn.getTime() + 1000) } 
        });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getStatus = async (req, res) => {
  const userId = req.user.id;
  try {
    // 1. Prioritize returning any active session (where checkOut is null)
    let attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        checkOut: null
      },
      orderBy: { checkIn: 'desc' }
    });

    // 2. If no active session, find the most recent completed log for the current attendance day
    if (!attendance) {
      const attendanceDayStart = getAttendanceDayStart(new Date());
      attendance = await prisma.attendance.findFirst({
        where: {
          userId,
          checkIn: { gte: attendanceDayStart }
        },
        orderBy: { checkIn: 'desc' }
      });
    }

    res.json(attendance || { message: 'Not checked in' });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const verifyLocation = async (req, res) => {
  const { location } = req.body || {};
  
  try {
    const offices = await prisma.office.findMany({ where: { companyId: req.user.companyId } });
    if (offices.length === 0) {
      return res.status(403).json({ 
        inRange: false, 
        error: 'Verification failed due to location not defined, contact admin' 
      });
    }

    const { accuracy } = req.body || {};
    const { inRange, lowPrecision } = isWithinRange(location, offices, accuracy);
    res.json({ inRange, lowPrecision });
  } catch (err) {
    res.status(500).json({ error: 'Spatial Verification Error' });
  }
};

const getHistory = async (req, res) => {
  const userId = req.user.id;
  const limit = req.query.limit ? parseInt(req.query.limit) : 50;

  try {
    const logs = await prisma.attendance.findMany({
      where: { userId },
      orderBy: { checkIn: 'desc' },
      take: limit
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance history' });
  }
};

const logMissedCheckoutReason = async (req, res) => {
  const { attendanceId, reason } = req.body || {};
  const userId = req.user.id;

  if (!attendanceId || !reason) {
    return res.status(400).json({ error: 'Missing attendanceId or reason' });
  }

  try {
    const record = await prisma.attendance.findFirst({
      where: { id: attendanceId, userId }
    });

    if (!record) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    const updatedNotes = record.notes 
      ? `${record.notes} | Reason: ${reason}` 
      : `Reason: ${reason}`;

    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: { notes: updatedNotes }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log missed checkout reason' });
  }
};

module.exports = { checkIn, checkOut, getStatus, verifyLocation, getHistory, logMissedCheckoutReason };
