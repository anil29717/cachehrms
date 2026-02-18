-- CreateTable
CREATE TABLE "api_access_logs" (
    "id" UUID NOT NULL,
    "api_access_id" UUID NOT NULL,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_access_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "api_access_logs" ADD CONSTRAINT "api_access_logs_api_access_id_fkey" FOREIGN KEY ("api_access_id") REFERENCES "api_access"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex for faster lookups by api_access_id and created_at
CREATE INDEX "api_access_logs_api_access_id_created_at_idx" ON "api_access_logs"("api_access_id", "created_at" DESC);
