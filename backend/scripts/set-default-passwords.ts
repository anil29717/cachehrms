/**
 * Set a default password for every user that does not have one.
 * Password is generated (random 12 chars: letters + digits + one symbol), stored hashed and in plain in DB.
 * Run from backend: npm run db:set-default-passwords
 */
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

function generatePassword(length = 12): string {
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const digits = '23456789';
  const symbol = '!@#$%';
  const all = lower + upper + digits + symbol;
  let result = '';
  result += lower[Math.floor(Math.random() * lower.length)];
  result += upper[Math.floor(Math.random() * upper.length)];
  result += digits[Math.floor(Math.random() * digits.length)];
  result += symbol[Math.floor(Math.random() * symbol.length)];
  for (let i = result.length; i < length; i++) {
    result += all[Math.floor(Math.random() * all.length)];
  }
  return result.split('').sort(() => Math.random() - 0.5).join('');
}

async function main() {
  type Row = { id: string; email: string; employee_id: string };
  const usersWithoutDefault = await prisma.$queryRaw<Row[]>`
    SELECT id, email, employee_id FROM users WHERE default_password IS NULL
  `;

  if (usersWithoutDefault.length === 0) {
    console.log('No users without a default password. Done.');
    return;
  }

  console.log(`Setting default password for ${usersWithoutDefault.length} user(s)...`);
  for (const user of usersWithoutDefault) {
    const plain = generatePassword();
    const passwordHash = await bcrypt.hash(plain, SALT_ROUNDS);
    await prisma.$executeRaw`
      UPDATE users SET password_hash = ${passwordHash}, default_password = ${plain} WHERE id::text = ${user.id}
    `;
    console.log(`  ${user.employee_id} (${user.email}): default password set`);
  }
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
