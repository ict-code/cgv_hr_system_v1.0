-- Fields needed to complete the CS Form 212 (2026) Personal Data Sheet mapping.

-- PhilSys Card Number
ALTER TABLE "employees" ADD COLUMN "philsysNo" TEXT;

-- Education: split the legacy concatenated schoolYear ("20002006") into real
-- From/To years, plus a yearGraduated field the old column never captured.
ALTER TABLE "employee_education" ADD COLUMN "attendanceFrom" INTEGER;
ALTER TABLE "employee_education" ADD COLUMN "attendanceTo" INTEGER;
ALTER TABLE "employee_education" ADD COLUMN "yearGraduated" INTEGER;

-- Backfill: 8-digit concatenated "YYYYYYYY" -> split into from/to (2054 real rows)
UPDATE "employee_education"
SET "attendanceFrom" = substring("schoolYear" from 1 for 4)::integer,
    "attendanceTo" = substring("schoolYear" from 5 for 4)::integer
WHERE "schoolYear" ~ '^[0-9]{8}$';

-- Backfill: "YYYY YYYY" space-separated (3 real rows)
UPDATE "employee_education"
SET "attendanceFrom" = split_part("schoolYear", ' ', 1)::integer,
    "attendanceTo" = split_part("schoolYear", ' ', 2)::integer
WHERE "schoolYear" ~ '^[0-9]{4} [0-9]{4}$';

-- Backfill: single 4-digit year -> only one year on record, use it for both ends (23 real rows)
UPDATE "employee_education"
SET "attendanceFrom" = "schoolYear"::integer,
    "attendanceTo" = "schoolYear"::integer
WHERE "schoolYear" ~ '^[0-9]{4}$';

ALTER TABLE "employee_education" DROP COLUMN "schoolYear";

-- Eligibility: license number/validity (CS Form 212 Section IV)
ALTER TABLE "employee_eligibility" ADD COLUMN "licenseNumber" TEXT;
ALTER TABLE "employee_eligibility" ADD COLUMN "licenseValidity" TIMESTAMP(3);

-- Training: Type of L&D classification
CREATE TYPE "LearningDevelopmentType" AS ENUM ('MANAGERIAL', 'SUPERVISORY', 'TECHNICAL', 'CLERICAL', 'OTHERS');
ALTER TABLE "employee_training" ADD COLUMN "type" "LearningDevelopmentType";

-- Voluntary Work (CS Form 212 Section VII) — new, no legacy backing table
CREATE TABLE "employee_voluntary_work" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "address" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "numberOfHours" INTEGER,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_voluntary_work_pkey" PRIMARY KEY ("id")
);

-- Non-Academic Distinctions/Recognition (CS Form 212 Section VIII item 32)
CREATE TABLE "employee_distinctions" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_distinctions_pkey" PRIMARY KEY ("id")
);

-- Membership in Association/Organization (CS Form 212 Section VIII item 33)
CREATE TABLE "employee_org_memberships" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_org_memberships_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "employee_voluntary_work" ADD CONSTRAINT "employee_voluntary_work_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_distinctions" ADD CONSTRAINT "employee_distinctions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_org_memberships" ADD CONSTRAINT "employee_org_memberships_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
