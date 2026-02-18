import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient; adminPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/** Optional: use postgres URL for writes when hrms_user lacks sequence permissions. Set MIGRATE_DATABASE_URL in .env */
const adminUrl = process.env.MIGRATE_DATABASE_URL;
export const adminPrisma =
  adminUrl && globalForPrisma.adminPrisma
    ? globalForPrisma.adminPrisma
    : adminUrl
      ? (globalForPrisma.adminPrisma = new PrismaClient({
          datasources: { db: { url: adminUrl } },
          log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        }))
      : null;
