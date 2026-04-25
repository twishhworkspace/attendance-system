const prisma = require('../backend/prisma/client');

async function main() {
  const offices = await prisma.office.findMany();
  console.log('Offices:', offices);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
