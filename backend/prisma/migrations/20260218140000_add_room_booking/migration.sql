-- CreateTable
CREATE TABLE "rooms" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "room_type" TEXT NOT NULL,
    "capacity" INTEGER,
    "amenities" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "employee_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookings_room_id_start_time_end_time_idx" ON "bookings"("room_id", "start_time", "end_time");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_code") ON DELETE CASCADE ON UPDATE CASCADE;
