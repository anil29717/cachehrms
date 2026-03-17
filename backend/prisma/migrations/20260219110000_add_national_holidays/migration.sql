-- CreateTable
CREATE TABLE "national_holidays" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "holiday_date" DATE NOT NULL,
    "year" INTEGER,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "national_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "national_holidays_holiday_date_idx" ON "national_holidays"("holiday_date");
CREATE INDEX "national_holidays_year_idx" ON "national_holidays"("year");
