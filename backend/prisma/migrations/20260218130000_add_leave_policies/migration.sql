-- CreateTable
CREATE TABLE "leave_policies" (
    "id" SERIAL NOT NULL,
    "leave_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "default_days_per_year" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "is_paid" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leave_policies_leave_type_key" ON "leave_policies"("leave_type");
