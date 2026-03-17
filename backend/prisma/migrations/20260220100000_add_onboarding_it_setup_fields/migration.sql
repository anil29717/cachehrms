-- AlterTable: add IT setup tracking to onboardings
ALTER TABLE "onboardings" ADD COLUMN IF NOT EXISTS "it_setup_completed_at" TIMESTAMPTZ;
ALTER TABLE "onboardings" ADD COLUMN IF NOT EXISTS "it_setup_notes" TEXT;
