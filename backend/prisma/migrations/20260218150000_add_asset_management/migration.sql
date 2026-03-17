-- CreateTable
CREATE TABLE "asset_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "category_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "serial_number" TEXT,
    "purchase_date" DATE,
    "status" TEXT NOT NULL DEFAULT 'available',
    "condition" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_allocations" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "employee_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL,
    "returned_at" TIMESTAMP(3),
    "condition_at_assignment" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_requests" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "requested_by" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completed_at" TIMESTAMP(3),
    "cost" DOUBLE PRECISION,
    "repair_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asset_categories_name_key" ON "asset_categories"("name");

-- CreateIndex
CREATE INDEX "asset_allocations_asset_id_idx" ON "asset_allocations"("asset_id");

-- CreateIndex
CREATE INDEX "asset_allocations_employee_id_idx" ON "asset_allocations"("employee_id");

-- CreateIndex
CREATE INDEX "maintenance_requests_asset_id_idx" ON "maintenance_requests"("asset_id");

-- CreateIndex
CREATE INDEX "maintenance_requests_status_idx" ON "maintenance_requests"("status");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "asset_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_allocations" ADD CONSTRAINT "asset_allocations_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_allocations" ADD CONSTRAINT "asset_allocations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "employees"("employee_code") ON DELETE CASCADE ON UPDATE CASCADE;
