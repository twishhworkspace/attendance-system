const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 [SEED] Starting Database Priming...');

  // 1. Create Main Branch Department
  const dept = await prisma.department.upsert({
    where: { name: 'MAIN BRANCH' },
    update: {},
    create: { name: 'MAIN BRANCH' }
  });
  console.log('✅ [SEED] Department Created: MAIN BRANCH');

  // 2. Create Executive Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@workspace.com' },
    update: {},
    create: {
      name: 'EXECUTIVE ADMIN',
      email: 'admin@workspace.com',
      password: hashedPassword,
      role: 'admin',
      departmentId: dept.id
    }
  });
  console.log('✅ [SEED] Executive User Created: admin@workspace.com / admin123');

  // 3. Create a Test Employee
  const empPassword = await bcrypt.hash('test123', 10);
  const testEmp = await prisma.user.upsert({
    where: { phoneNumber: '1234567890' },
    update: {},
    create: {
      name: 'TEST EMPLOYEE',
      phoneNumber: '1234567890',
      email: 'test@workspace.com',
      password: empPassword,
      role: 'employee',
      departmentId: dept.id
    }
  });
  console.log('✅ [SEED] Test Employee Created: 1234567890 / test123');

  // 4. Create Default Location
  const defaultLoc = await prisma.officeLocation.upsert({
    where: { id: 1 }, 
    update: {},
    create: {
      id: 1,
      name: 'HEADQUARTERS',
      latitude: 18.64699,
      longitude: 73.88892,
      radius: 100.0
    }
  });
  console.log('✅ [SEED] Default Location Created: HEADQUARTERS (100m Radius Enforced)');

  console.log('🏁 [SEED] Priming Complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
