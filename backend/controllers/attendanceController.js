const prisma = require('../db');
const { isWithinRange } = require('../utils/geofencing');
const { logAction } = require('../utils/logger');

const checkIn = async (req, res) => {
  const { location, accuracy, ip, photoUrl } = req.body || {};
  const userId = req.user.id;

  try {
    // Check if user already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
      where: {
        userId,
        checkIn: { gte: today }
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
    const { inRange, lowPrecision, matchedOffice } = isWithinRange(location, offices, accuracy);
    
    if (lowPrecision) {
      return res.status(403).json({ error: 'Tactical Signal Interference: GPS accuracy too low. Please move to an open area and retry.' });
    }

    if (!inRange) {
      return res.status(403).json({ error: 'Spatial Violation: You are outside the authorized office zone (100m).' });
    }

    // Status Determination (PRESENT vs LATE)
    let status = 'PRESENT';
    if (matchedOffice && matchedOffice.startTime) {
        const now = new Date();
        const [startH, startM] = matchedOffice.startTime.split(':').map(Number);
        const shiftStart = new Date();
        shiftStart.setHours(startH, startM, 0, 0);
        
        if (now > shiftStart) {
            status = 'LATE';
        }
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        companyId: req.user.companyId,
        checkIn: new Date(),
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
      details: `Coordinates: ${location} | Accuracy: ${accuracy || 'N/A'}m`,
      ip: req.ip
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const checkOut = async (req, res) => {
  const { location, accuracy } = req.body || {};
  const userId = req.user.id;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        checkIn: { gte: today },
        checkOut: null
      }
    });

    if (!attendance) {
      return res.status(400).json({ error: 'No active check-in found for today' });
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
        checkOut: new Date(),
        checkOutLocation: location,
        checkOutAccuracy: accuracy ? parseFloat(accuracy) : null
      }
    });

    // Temporal Integrity Verification
    if (updated.checkOut < updated.checkIn) {
        // This should technically be impossible with new Date(), but protects against DB clock drift or manual injection
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        checkIn: { gte: today }
      }
    });

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

module.exports = { checkIn, checkOut, getStatus, verifyLocation };
