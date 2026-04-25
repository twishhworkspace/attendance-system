const prisma = require('../backend/prisma/client');

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users:', users);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
