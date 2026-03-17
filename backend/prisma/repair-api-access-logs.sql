-- Run this ONLY if the failed migration already changed api_access_logs.api_access_id to TEXT.
-- It restores UUID type and re-adds the foreign key and index.
-- Execute with: psql -h 172.16.110.46 -U hrms_user -d cachedigitech_hrms -f prisma/repair-api-access-logs.sql

-- If column is already UUID, these will fail harmlessly (or skip manually).
ALTER TABLE "api_access_logs" DROP CONSTRAINT IF EXISTS "api_access_logs_api_access_id_fkey";
ALTER TABLE "api_access_logs" ALTER COLUMN "api_access_id" SET DATA TYPE UUID USING api_access_id::uuid;
ALTER TABLE "api_access_logs" ADD CONSTRAINT "api_access_logs_api_access_id_fkey" FOREIGN KEY ("api_access_id") REFERENCES "api_access"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "api_access_logs_api_access_id_created_at_idx" ON "api_access_logs"("api_access_id", "created_at" DESC);
