const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: '8767878517' },
        { mobileNumber: '8767878517' }
      ]
    }
  });
  console.log('USER_FOUND:', JSON.stringify(user, null, 2));
  process.exit(0);
}

checkUser();
