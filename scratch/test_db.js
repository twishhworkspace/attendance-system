const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.leaveRequest.count();
    console.log('LeaveRequest count:', count);
  } catch (err) {
    console.error('Error fetching LeaveRequest:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
