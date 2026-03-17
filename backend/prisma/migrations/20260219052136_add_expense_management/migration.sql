-- CreateTable
CREATE TABLE "expense_types" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "limit_amount" DOUBLE PRECISION NOT NULL,
    "limit_unit" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_claims" (
    "id" UUID NOT NULL,
    "employee_id" TEXT NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "manager_approved_at" TIMESTAMP(3),
    "manager_approved_by" UUID,
    "finance_approved_at" TIMESTAMP(3),
    "finance_approved_by" UUID,
    "hr_approved_at" TIMESTAMP(3),
    "hr_approved_by" UUID,
    "rejected_at" TIMESTAMP(3),
    "rejected_by" UUID,
    "reject_reason" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_claim_items" (
    "id" UUID NOT NULL,
    "claim_id" UUID NOT NULL,
    "expense_type_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION,
    "description" TEXT,
    "expense_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_claim_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expense_claims_employee_id_idx" ON "expense_claims"("employee_id");

-- CreateIndex
CREATE INDEX "expense_claims_status_idx" ON "expense_claims"("status");

-- CreateIndex
CREATE INDEX "expense_claim_items_claim_id_idx" ON "expense_claim_items"("claim_id");

-- AddForeignKey
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_claim_items" ADD CONSTRAINT "expense_claim_items_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "expense_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_claim_items" ADD CONSTRAINT "expense_claim_items_expense_type_id_fkey" FOREIGN KEY ("expense_type_id") REFERENCES "expense_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
