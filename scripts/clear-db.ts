import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  
  await prisma.session.deleteMany({});
  console.log('✓ Cleared sessions');
  
  await prisma.account.deleteMany({});
  console.log('✓ Cleared accounts');
  
  await prisma.review.deleteMany({});
  console.log('✓ Cleared reviews');
  
  await prisma.user.deleteMany({});
  console.log('✓ Cleared users');
  
  console.log('\n✅ Database cleared successfully!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
