/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `departments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[invite_token]` on the table `onboardings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "onboardings_invite_token_key" ON "onboardings"("invite_token");
