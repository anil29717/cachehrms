-- AlterTable
ALTER TABLE "employees"
ADD COLUMN IF NOT EXISTS "external_role" TEXT NOT NULL DEFAULT 'employee';

