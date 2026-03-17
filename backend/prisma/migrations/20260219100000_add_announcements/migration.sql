-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "event_date" DATE,
    "created_by" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_reads" (
    "id" UUID NOT NULL,
    "announcement_id" UUID NOT NULL,
    "employee_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "announcements_type_idx" ON "announcements"("type");
CREATE INDEX "announcements_sent_at_idx" ON "announcements"("sent_at");
CREATE INDEX "announcements_event_date_idx" ON "announcements"("event_date");
CREATE UNIQUE INDEX "announcement_reads_announcement_id_employee_id_key" ON "announcement_reads"("announcement_id", "employee_id");
CREATE INDEX "announcement_reads_announcement_id_idx" ON "announcement_reads"("announcement_id");
CREATE INDEX "announcement_reads_employee_id_idx" ON "announcement_reads"("employee_id");

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("employee_code") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_code") ON DELETE CASCADE ON UPDATE CASCADE;
