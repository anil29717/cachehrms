/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `departments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[invite_token]` on the table `onboardings` will be added. If there are existing duplicate values, this will fail.

  These indexes may already exist from migration 20260220000000_add_onboarding_flow; using IF NOT EXISTS so this migration is safe to run.
*/
-- CreateIndex (idempotent: skip if already exists)
CREATE UNIQUE INDEX IF NOT EXISTS "departments_code_key" ON "departments"("code");

-- CreateIndex (idempotent: skip if already exists)
CREATE UNIQUE INDEX IF NOT EXISTS "onboardings_invite_token_key" ON "onboardings"("invite_token");
