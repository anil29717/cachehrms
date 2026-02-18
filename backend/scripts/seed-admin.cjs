// Run seed using MIGRATE_DATABASE_URL (postgres) so inserts succeed.
// Usage: npm run db:seed:admin
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const url = process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('Set MIGRATE_DATABASE_URL in .env');
  process.exit(1);
}
const { execSync } = require('child_process');
const env = { ...process.env, DATABASE_URL: url };
execSync('npx tsx prisma/seed.ts', {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..'),
  env,
});
