-- AlterTable
ALTER TABLE "tickets" ADD COLUMN "regarding_employee_code" TEXT;

-- CreateIndex
CREATE INDEX "tickets_regarding_employee_code_idx" ON "tickets"("regarding_employee_code");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_regarding_employee_code_fkey" FOREIGN KEY ("regarding_employee_code") REFERENCES "employees"("employee_code") ON DELETE SET NULL ON UPDATE CASCADE;
