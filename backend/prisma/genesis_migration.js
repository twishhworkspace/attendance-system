const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Genesis Migration: Redirecting existing data to Multi-Tenant...");

  // 1. Ensure a Genesis Company exists
  let genesisCompany = await prisma.company.findFirst({
    where: { name: "TwishhSync Genesis" }
  });

  if (!genesisCompany) {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 10); // 10 Year buffer for existing users
    
    genesisCompany = await prisma.company.create({
      data: {
        name: "TwishhSync Genesis",
        email: "twishhsync@internal.local",
        subscriptionStatus: "ACTIVE",
        plan: "PRO",
        employeeLimit: -1,
        expiryDate: expiry,
        adminNote: "Original system data migrated via Genesis Script."
      }
    });
    console.log(`✅ Created Genesis Company: ${genesisCompany.name}`);
  } else {
    console.log(`ℹ️ Genesis Company found. Skipping creation.`);
  }

  const cid = genesisCompany.id;

  // 2. Migrate Departments
  const deptCount = await prisma.department.updateMany({
    where: { companyId: 0 }, // Assuming we defaulted them or they are currently null/0
    data: { companyId: cid }
  });
  console.log(`📦 Migrated ${deptCount.count} Departments.`);

  // 3. Migrate Users
  const userCount = await prisma.user.updateMany({
    where: { companyId: 0 },
    data: { companyId: cid }
  });
  console.log(`👤 Migrated ${userCount.count} Users.`);

  // 4. Migrate Locations
  const locationCount = await prisma.officeLocation.updateMany({
    where: { companyId: 0 },
    data: { companyId: cid }
  });
  console.log(`📍 Migrated ${locationCount.count} Office Locations.`);

  // 5. Migrate Holidays
  const holidayCount = await prisma.holiday.updateMany({
    where: { companyId: 0 },
    data: { companyId: cid }
  });
  console.log(`🗓 Migrated ${holidayCount.count} Holidays.`);

  // 6. Migrate Notices
  const noticeCount = await prisma.notice.updateMany({
    where: { companyId: 0 },
    data: { companyId: cid }
  });
  console.log(`📢 Migrated ${noticeCount.count} Notices.`);

  console.log("🏁 Genesis Migration Completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Migration Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
