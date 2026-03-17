-- AlterTable
ALTER TABLE "employees"
ADD COLUMN IF NOT EXISTS "external_sub_role" TEXT;

