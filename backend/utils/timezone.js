/**
 * Timezone utilities to align UTC server execution time with IST (Asia/Kolkata, UTC+5.30)
 */

const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds

/**
 * Get the current time or a specific time shifted to IST representation (for formatting or component logs)
 */
const getISTDate = (date = new Date()) => {
  return new Date(date.getTime() + IST_OFFSET);
};

/**
 * Get the start of the attendance day (5:00 AM IST) in UTC for a given reference date
 */
const getAttendanceDayStart = (date = new Date()) => {
  const d = new Date(date);
  
  // Shift to IST representation
  const istTime = d.getTime() + IST_OFFSET;
  const istDate = new Date(istTime);
  
  // Check if IST hour is < 5 (before 5:00 AM IST)
  if (istDate.getUTCHours() < 5) {
    istDate.setUTCDate(istDate.getUTCDate() - 1);
  }
  
  // Set to 5:00 AM IST
  istDate.setUTCHours(5, 0, 0, 0);
  
  // Convert back to UTC
  return new Date(istDate.getTime() - IST_OFFSET);
};

/**
 * Get the end of the attendance day (5:00 AM IST on the next day) in UTC for a given reference date
 */
const getAttendanceDayEnd = (date = new Date()) => {
  const start = getAttendanceDayStart(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
};

/**
 * Get the shift end time in UTC for a given check-in date and office endTime ("HH:MM" in IST)
 */
const getShiftEnd = (checkInDate, endTimeString = "20:00") => {
  const [endH, endM] = endTimeString.split(':').map(Number);
  
  // Shift checkInDate to IST
  const checkInIstTime = checkInDate.getTime() + IST_OFFSET;
  const istDate = new Date(checkInIstTime);
  
  // Store the check-in calendar day start (00:00:00) in IST
  const checkInDay = new Date(istDate);
  checkInDay.setUTCHours(0, 0, 0, 0);
  
  // Set the shift end time on the check-in calendar day
  const endIstDate = new Date(checkInDay);
  endIstDate.setUTCHours(endH, endM, 0, 0);
  
  // Boundary calculations:
  const checkInHour = istDate.getUTCHours();
  if ((endH < 5 || (endH < 12 && checkInHour >= 12)) && checkInHour >= 5) {
    // If the shift end is before 5 AM, or is a morning shift end (before 12 PM) and check-in was in the afternoon/evening (>= 12),
    // the shift ends on the next calendar day.
    endIstDate.setUTCDate(endIstDate.getUTCDate() + 1);
  } else if (endH >= 12 && checkInHour < 5) {
    // If the shift end is a day shift (>= 12 PM) and check-in was after midnight (< 5 AM),
    // the shift end is on the previous calendar day.
    endIstDate.setUTCDate(endIstDate.getUTCDate() - 1);
  }
  
  // Convert back to UTC Date
  return new Date(endIstDate.getTime() - IST_OFFSET);
};

module.exports = {
  getISTDate,
  getAttendanceDayStart,
  getAttendanceDayEnd,
  getShiftEnd,
  IST_OFFSET
};
