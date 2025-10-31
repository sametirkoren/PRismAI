import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing all authentication data...");
  
  await prisma.session.deleteMany({});
  console.log("✓ Cleared all sessions");
  
  await prisma.account.deleteMany({});
  console.log("✓ Cleared all accounts");
  
  await prisma.user.deleteMany({});
  console.log("✓ Cleared all users");
  
  console.log("\nDone! Please sign in again to re-authenticate.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
