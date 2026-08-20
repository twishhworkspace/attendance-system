const prisma = require('../db');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('--- UPDATING SUPER ADMIN CREDENTIALS ---');

  // Clear existing users to ensure clean slate
  await prisma.user.deleteMany({});
  await prisma.company.deleteMany({});

  console.log('Provisioning new Super Admin...');
  const masterPassword = await bcrypt.hash('Pal@2004', 10);
  
  await prisma.user.create({
    data: {
      email: 'admin@twishhworkspace.com',
      password: masterPassword,
      name: 'Master Admin',
      role: 'SUPER_ADMIN'
    }
  });

  console.log('✅ Super Admin updated successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Update Failure:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
