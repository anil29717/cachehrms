-- AlterTable: add Department.code for employee ID (EMP-YYYY-DEPT-NNN)
ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "code" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "departments_code_key" ON "departments"("code") WHERE "code" IS NOT NULL;

-- Onboarding main table
CREATE TABLE "onboardings" (
    "id" UUID NOT NULL,
    "candidate_email" TEXT NOT NULL,
    "employee_type" TEXT NOT NULL,
    "current_stage" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'OFFER_ACCEPTED',
    "department_id" INTEGER,
    "designation" TEXT,
    "invite_token" TEXT,
    "invite_token_exp" TIMESTAMPTZ,
    "employee_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboardings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "onboardings_invite_token_key" ON "onboardings"("invite_token") WHERE "invite_token" IS NOT NULL;

ALTER TABLE "onboardings" ADD CONSTRAINT "onboardings_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "onboardings" ADD CONSTRAINT "onboardings_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- Onboarding personal info (Stage 2)
CREATE TABLE "onboarding_personal_info" (
    "id" UUID NOT NULL,
    "onboarding_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "date_of_birth" DATE NOT NULL,
    "gender" TEXT NOT NULL,
    "marital_status" TEXT,
    "nationality" TEXT NOT NULL,
    "blood_group" TEXT,
    "personal_email" TEXT NOT NULL,
    "personal_mobile" TEXT NOT NULL,
    "alternate_mobile" TEXT,
    "current_address" TEXT NOT NULL,
    "current_city" TEXT NOT NULL,
    "current_state" TEXT NOT NULL,
    "current_pincode" TEXT NOT NULL,
    "current_country" TEXT NOT NULL,
    "permanent_address" TEXT NOT NULL,
    "permanent_city" TEXT NOT NULL,
    "permanent_state" TEXT NOT NULL,
    "permanent_pincode" TEXT NOT NULL,
    "permanent_country" TEXT NOT NULL,
    "pan_number" TEXT,
    "aadhaar_number" TEXT,
    "passport_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_personal_info_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "onboarding_personal_info_onboarding_id_key" ON "onboarding_personal_info"("onboarding_id");
ALTER TABLE "onboarding_personal_info" ADD CONSTRAINT "onboarding_personal_info_onboarding_id_fkey" FOREIGN KEY ("onboarding_id") REFERENCES "onboardings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Onboarding documents (Stage 3)
CREATE TABLE "onboarding_documents" (
    "id" UUID NOT NULL,
    "onboarding_id" UUID NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER,
    "verification_status" TEXT NOT NULL DEFAULT 'PENDING',
    "verified_by" UUID,
    "verified_at" TIMESTAMPTZ,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_documents_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "onboarding_documents" ADD CONSTRAINT "onboarding_documents_onboarding_id_fkey" FOREIGN KEY ("onboarding_id") REFERENCES "onboardings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Onboarding bank details (Stage 4)
CREATE TABLE "onboarding_bank_details" (
    "id" UUID NOT NULL,
    "onboarding_id" UUID NOT NULL,
    "account_holder_name" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "branch_name" TEXT,
    "account_number" TEXT NOT NULL,
    "ifsc_code" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_bank_details_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "onboarding_bank_details_onboarding_id_key" ON "onboarding_bank_details"("onboarding_id");
ALTER TABLE "onboarding_bank_details" ADD CONSTRAINT "onboarding_bank_details_onboarding_id_fkey" FOREIGN KEY ("onboarding_id") REFERENCES "onboardings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Onboarding emergency contacts (Stage 5)
CREATE TABLE "onboarding_emergency_contacts" (
    "id" UUID NOT NULL,
    "onboarding_id" UUID NOT NULL,
    "contact_name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternate_phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_emergency_contacts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "onboarding_emergency_contacts" ADD CONSTRAINT "onboarding_emergency_contacts_onboarding_id_fkey" FOREIGN KEY ("onboarding_id") REFERENCES "onboardings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Onboarding educations (Stage 6)
CREATE TABLE "onboarding_educations" (
    "id" UUID NOT NULL,
    "onboarding_id" UUID NOT NULL,
    "qualification" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "university_board" TEXT NOT NULL,
    "year_of_passing" INTEGER NOT NULL,
    "percentage_or_cgpa" TEXT,
    "division_or_class" TEXT,
    "specialization" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "marksheet_path" TEXT,
    "degree_cert_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_educations_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "onboarding_educations" ADD CONSTRAINT "onboarding_educations_onboarding_id_fkey" FOREIGN KEY ("onboarding_id") REFERENCES "onboardings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Onboarding experiences (Stage 7 - switching only)
CREATE TABLE "onboarding_experiences" (
    "id" UUID NOT NULL,
    "onboarding_id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "employment_type" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "reason_for_leaving" TEXT,
    "last_drawn_salary" TEXT,
    "reporting_manager_name" TEXT,
    "experience_letter_path" TEXT,
    "salary_slip_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_experiences_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "onboarding_experiences" ADD CONSTRAINT "onboarding_experiences_onboarding_id_fkey" FOREIGN KEY ("onboarding_id") REFERENCES "onboardings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
