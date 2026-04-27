const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('--- STARTING DATABASE SANITIZATION ---');
  const users = await prisma.user.findMany({
    where: { mobileNumber: { not: null } }
  });

  for (const user of users) {
    const original = user.mobileNumber;
    const cleaned = original.replace(/\D/g, ''); // Keep only digits

    if (original !== cleaned && cleaned.length >= 10) {
      await prisma.user.update({
        where: { id: user.id },
        data: { mobileNumber: cleaned }
      });
      console.log(`✓ Cleaned User ${user.name}: [${original}] -> [${cleaned}]`);
    }
  }
  console.log('--- SANITIZATION COMPLETE ---');
  process.exit(0);
}

cleanDatabase();
