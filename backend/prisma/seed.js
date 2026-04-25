const prisma = require('./client');
const bcrypt = require('bcryptjs');

async function main() {
  // Clear existing data (due to cascading deletes, deleting companies should wipe mostly everything)
  await prisma.outLocationRequest.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.sector.deleteMany({});
  await prisma.company.deleteMany({});

  console.log('Seeding demo company...');
  const defaultCompany = await prisma.company.create({
    data: {
      name: 'TwishhSync Demo Corp',
      address: 'New Delhi HQ'
    }
  });

  console.log('Seeding sectors for company...');
  const itSector = await prisma.sector.create({ data: { name: 'IT Department', companyId: defaultCompany.id } });
  const hrSector = await prisma.sector.create({ data: { name: 'HR Department', companyId: defaultCompany.id } });
  const salesSector = await prisma.sector.create({ data: { name: 'Sales Department', companyId: defaultCompany.id } });

  console.log('Seeding users...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const employeePassword = await bcrypt.hash('employee123', 10);

  // We are mapping the old ADMIN to COMPANY_ADMIN for to match the multi-tenant SaaS model
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Company Admin',
      role: 'COMPANY_ADMIN',
      companyId: defaultCompany.id
    }
  });

  await prisma.user.create({
    data: {
      email: 'employee@example.com',
      password: employeePassword,
      name: 'John Doe',
      role: 'EMPLOYEE',
      companyId: defaultCompany.id,
      sectorId: itSector.id
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
