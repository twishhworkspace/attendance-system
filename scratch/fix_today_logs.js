const prisma = require('../backend/db');

async function fix() {
  console.log('◇ Starting database correction for today (May 20, 2026)...');
  
  // 1. Get all attendance logs for today
  const logs = await prisma.attendance.findMany({
    where: {
      checkIn: {
        gte: new Date('2026-05-19T23:30:00.000Z'), // May 20 05:00 AM IST
        lte: new Date('2026-05-20T23:30:00.000Z')  // May 21 05:00 AM IST
      }
    },
    include: {
      user: true
    }
  });

  console.log(`◇ Found ${logs.length} logs for today.`);

  for (const log of logs) {
    const checkInTime = new Date(log.checkIn);
    // 10:00 AM IST today is 2026-05-20T04:30:00.000Z UTC
    const tenAM_IST = new Date('2026-05-20T04:30:00.000Z');
    
    let targetStatus = 'PRESENT';
    if (checkInTime > tenAM_IST) {
      targetStatus = 'LATE';
    }

    console.log(`\n👉 User: ${log.user.name} (${log.user.email})`);
    console.log(`   Check-in: ${checkInTime.toISOString()} (${checkInTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })})`);
    console.log(`   Current Status: ${log.status} | Target Status: ${targetStatus}`);

    const updateData = {
      status: targetStatus
    };

    // If it was incorrectly auto-checked out, restore it to active state
    if (log.isAutoCheckout) {
      console.log(`   ⚠️ Session was incorrectly auto-checked out! Restoring to active.`);
      updateData.checkOut = null;
      updateData.isAutoCheckout = false;
      updateData.notes = null;

      // Revert the forgotCheckoutCount penalty for the user
      const currentCount = log.user.forgotCheckoutCount;
      const revertedCount = Math.max(0, currentCount - 1);
      console.log(`   Reverting forgotCheckoutCount penalty: ${currentCount} -> ${revertedCount}`);
      
      await prisma.user.update({
        where: { id: log.userId },
        data: { forgotCheckoutCount: revertedCount }
      });
    }

    await prisma.attendance.update({
      where: { id: log.id },
      data: updateData
    });
    
    console.log(`   ✓ Corrected!`);
  }

  console.log('\n🎉 Today\'s live attendance records and compliance scores corrected successfully!');
}

fix().catch(console.error);
