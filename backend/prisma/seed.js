// Seeds one admin account and the default configuration row.
// Run with: npm run seed
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@society.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@123";

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const hash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        name: "Society Admin",
        email: adminEmail,
        password: hash,
        role: "admin",
        flatNumber: "Office",
      },
    });
    console.log(`Admin account created -> ${adminEmail} / ${adminPassword}`);
  } else {
    console.log("Admin account already exists, skipping.");
  }

  const config = await prisma.config.findUnique({ where: { id: "singleton" } });
  if (!config) {
    await prisma.config.create({ data: { id: "singleton", overdueThresholdDays: 5 } });
    console.log("Default config created (overdueThresholdDays = 5).");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
