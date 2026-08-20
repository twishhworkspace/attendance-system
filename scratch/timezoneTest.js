const {
  getISTDate,
  getAttendanceDayStart,
  getAttendanceDayEnd,
  getShiftEnd,
  IST_OFFSET
} = require('../backend/utils/timezone');

function assertEqual(actual, expected, message) {
  const actualStr = actual instanceof Date ? actual.toISOString() : String(actual);
  const expectedStr = expected instanceof Date ? expected.toISOString() : String(expected);
  if (actualStr === expectedStr) {
    console.log(`✅ PASS: ${message}`);
  } else {
    console.error(`❌ FAIL: ${message}`);
    console.error(`   Actual:   ${actualStr}`);
    console.error(`   Expected: ${expectedStr}`);
    process.exit(1);
  }
}

console.log('--- STARTING TIMEZONE VALIDATION TESTS ---');

// Test Case 1: getISTDate
const utcDate = new Date('2026-05-20T10:00:00.000Z'); // 10:00 AM UTC
const istDate = getISTDate(utcDate); // Should be 3:30 PM UTC representation (shifted)
assertEqual(istDate, new Date('2026-05-20T15:30:00.000Z'), 'getISTDate basic offset shift');

// Test Case 2: getAttendanceDayStart for early morning IST (before 5:00 AM IST)
// e.g. 4:30 AM IST on May 20, 2026 => 2026-05-19T23:00:00.000Z in UTC
const earlyCheckInUTC = new Date('2026-05-19T23:00:00.000Z');
// It should belong to May 19 attendance day, starting at May 19 05:00 AM IST => 2026-05-18T23:30:00.000Z UTC
const earlyDayStart = getAttendanceDayStart(earlyCheckInUTC);
assertEqual(earlyDayStart, new Date('2026-05-18T23:30:00.000Z'), 'getAttendanceDayStart for early morning IST check-in');

// Test Case 3: getAttendanceDayStart for typical day check-in (after 5:00 AM IST)
// e.g. 10:14 AM IST on May 20, 2026 => 2026-05-20T04:44:00.000Z UTC
const typicalCheckInUTC = new Date('2026-05-20T04:44:00.000Z');
// It should belong to May 20 attendance day, starting at May 20 05:00 AM IST => 2026-05-19T23:30:00.000Z UTC
const typicalDayStart = getAttendanceDayStart(typicalCheckInUTC);
assertEqual(typicalDayStart, new Date('2026-05-19T23:30:00.000Z'), 'getAttendanceDayStart for standard daytime IST check-in');

// Test Case 4: getAttendanceDayEnd for standard daytime IST check-in
// Should end 24 hours later => 2026-05-20T23:30:00.000Z UTC (May 21 05:00 AM IST)
const typicalDayEnd = getAttendanceDayEnd(typicalCheckInUTC);
assertEqual(typicalDayEnd, new Date('2026-05-20T23:30:00.000Z'), 'getAttendanceDayEnd for standard daytime IST check-in');

// Test Case 5: getShiftEnd - Standard Day Shift (e.g. 20:00 PM IST shift end)
// check-in is 10:14 AM IST (2026-05-20T04:44:00.000Z UTC)
// shift end should be 8:00 PM IST on May 20 => 2026-05-20T14:30:00.000Z UTC
const normalShiftEnd = getShiftEnd(typicalCheckInUTC, '20:00');
assertEqual(normalShiftEnd, new Date('2026-05-20T14:30:00.000Z'), 'getShiftEnd for standard shift (8:00 PM IST)');

// Test Case 6: getShiftEnd - Cross-Midnight Night Shift (e.g. 01:30 AM IST shift end)
// check-in is 10:14 AM IST on May 20 (2026-05-20T04:44:00.000Z UTC)
// shift end should be 1:30 AM IST on May 21 => 2026-05-20T20:00:00.000Z UTC
const nightShiftEnd = getShiftEnd(typicalCheckInUTC, '01:30');
assertEqual(nightShiftEnd, new Date('2026-05-20T20:00:00.000Z'), 'getShiftEnd for cross-midnight shift (1:30 AM IST)');

// Test Case 7: getShiftEnd - Cross-Midnight Night Shift Late Check-in (after midnight, e.g. 1:00 AM IST check-in)
// check-in is 1:00 AM IST on May 21 (2026-05-20T19:30:00.000Z UTC)
// shift end is 1:30 AM IST on May 21 => 2026-05-20T20:00:00.000Z UTC (same day shift end)
const lateNightCheckIn = new Date('2026-05-20T19:30:00.000Z');
const lateNightShiftEnd = getShiftEnd(lateNightCheckIn, '01:30');
assertEqual(lateNightShiftEnd, new Date('2026-05-20T20:00:00.000Z'), 'getShiftEnd for cross-midnight late-night check-in');

// Test Case 8: getShiftEnd - Night Shift Late check-in (after midnight) but office time is standard (20:00 PM IST)
// e.g. late check-in is 1:00 AM IST on May 21 (2026-05-20T19:30:00.000Z UTC) for yesterday's shift that ended at 8:00 PM IST on May 20 (2026-05-20T14:30:00.000Z UTC)
const lateStandardShiftEnd = getShiftEnd(lateNightCheckIn, '20:00');
assertEqual(lateStandardShiftEnd, new Date('2026-05-20T14:30:00.000Z'), 'getShiftEnd for standard shift but late-night check-in');

console.log('🎉 ALL TIMEZONE ARITHMETIC TESTS PASSED SUCCESSFULLY! 🎉');
