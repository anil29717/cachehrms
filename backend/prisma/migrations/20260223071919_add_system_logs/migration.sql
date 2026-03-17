-- CreateTable
CREATE TABLE "system_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "employee_id" TEXT,
    "email" VARCHAR(255),
    "method" VARCHAR(10) NOT NULL,
    "path" VARCHAR(512) NOT NULL,
    "status_code" INTEGER NOT NULL,
    "ip" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_logs_created_at_idx" ON "system_logs"("created_at");

-- CreateIndex
CREATE INDEX "system_logs_user_id_idx" ON "system_logs"("user_id");

-- CreateIndex
CREATE INDEX "system_logs_employee_id_idx" ON "system_logs"("employee_id");

-- CreateIndex
CREATE INDEX "system_logs_method_idx" ON "system_logs"("method");

-- CreateIndex
CREATE INDEX "system_logs_path_idx" ON "system_logs"("path");
