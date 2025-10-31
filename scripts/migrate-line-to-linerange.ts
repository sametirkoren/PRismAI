import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateLineToLineRange() {
  console.log('🔄 Starting migration: line → lineRange...\n');

  try {
    // Get all reviews
    const reviews = await prisma.review.findMany({
      where: {
        status: 'COMPLETED',
      },
    });

    console.log(`📊 Found ${reviews.length} completed reviews\n`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const review of reviews) {
      let needsUpdate = false;
      const updates: any = {};

      // Check and migrate critical
      if (review.critical) {
        const critical = JSON.parse(JSON.stringify(review.critical));
        if (Array.isArray(critical) && critical.length > 0 && 'line' in critical[0]) {
          updates.critical = critical.map((item: any) => ({
            ...item,
            lineRange: item.line ? String(item.line) : '1',
          }));
          updates.critical.forEach((item: any) => delete item.line);
          needsUpdate = true;
        }
      }

      // Check and migrate suggestions
      if (review.suggestions) {
        const suggestions = JSON.parse(JSON.stringify(review.suggestions));
        if (Array.isArray(suggestions) && suggestions.length > 0 && 'line' in suggestions[0]) {
          updates.suggestions = suggestions.map((item: any) => ({
            ...item,
            lineRange: item.line ? String(item.line) : '1',
          }));
          updates.suggestions.forEach((item: any) => delete item.line);
          needsUpdate = true;
        }
      }

      // Check and migrate bestPractices
      if (review.bestPractices) {
        const bestPractices = JSON.parse(JSON.stringify(review.bestPractices));
        if (Array.isArray(bestPractices) && bestPractices.length > 0 && 'line' in bestPractices[0]) {
          updates.bestPractices = bestPractices.map((item: any) => ({
            ...item,
            lineRange: item.line ? String(item.line) : '1',
          }));
          updates.bestPractices.forEach((item: any) => delete item.line);
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await prisma.review.update({
          where: { id: review.id },
          data: updates,
        });
        console.log(`✅ Migrated review ${review.id}`);
        migratedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`\n✨ Migration complete!`);
    console.log(`   Migrated: ${migratedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateLineToLineRange();
