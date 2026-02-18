// Run migrate deploy using MIGRATE_DATABASE_URL (e.g. postgres) so tables get created.
// Usage: npm run db:deploy:admin
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const url = process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('Set MIGRATE_DATABASE_URL in .env (e.g. postgres URL)');
  process.exit(1);
}
const { execSync } = require('child_process');
const env = { ...process.env, DATABASE_URL: url };
execSync('npx prisma migrate deploy', {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..'),
  env,
});
