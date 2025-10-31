#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking database setup...');

// Check if .env.local exists and has DATABASE_URL
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env.local not found. Please create it with DATABASE_URL');
  process.exit(0);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
if (!envContent.includes('DATABASE_URL=') || envContent.includes('DATABASE_URL=your-')) {
  console.log('⚠️  DATABASE_URL not configured in .env.local');
  process.exit(0);
}

try {
  // Check if database schema is in sync
  console.log('📊 Checking database schema...');
  
  try {
    // Try to push schema changes (this will also check if DB is accessible)
    const pushOutput = execSync('npx prisma db push --skip-generate --accept-data-loss', { 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    if (pushOutput.includes('already in sync')) {
      console.log('✅ Database schema is up to date');
    } else if (pushOutput.includes('Your database is now in sync')) {
      console.log('✅ Database schema updated');
    }
  } catch (pushError) {
    // If push fails, database might not exist or have connection issues
    if (pushError.message.includes('does not exist') || 
        pushError.message.includes('P1001') ||
        pushError.message.includes('P1003')) {
      console.log('📦 Database not initialized. Running setup...');
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      console.log('✅ Database setup completed');
    } else {
      throw pushError;
    }
  }
  
  // Generate Prisma Client
  console.log('⚙️  Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'pipe' });
  console.log('✅ Prisma Client generated');
  
} catch (error) {
  console.log('⚠️  Database check skipped:', error.message.split('\n')[0]);
  console.log('\n💡 Please run manually: npx prisma db push');
}

console.log('✨ Ready to start development server\n');
