-- AlterTable
ALTER TABLE "api_access" ADD COLUMN IF NOT EXISTS "rate_limit_per_hour" INTEGER NOT NULL DEFAULT 1000;
