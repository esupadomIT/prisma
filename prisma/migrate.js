require('dotenv').config({ path: '.env.local' });  // Load environment variables from .env.local

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();
  console.log("Prisma connected successfully.");
  // Your migration logic here (if any)
}

main()
  .catch((e) => {
    throw e
  })
  .finally(async () => {
    await prisma.$disconnect()
  });
