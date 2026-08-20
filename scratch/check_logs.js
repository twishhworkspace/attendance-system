const prisma = require('../backend/db');

async function check() {
  const logs = await prisma.attendance.findMany({
    where: {
      checkIn: {
        gte: new Date('2026-05-19T23:30:00.000Z')
      }
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });
  console.log(JSON.stringify(logs, null, 2));
}

check().catch(console.error);
