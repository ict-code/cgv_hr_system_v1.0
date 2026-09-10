-- CreateTable
CREATE TABLE "salary_grade_tables" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_grade_tables_pkey" PRIMARY KEY ("id")
);

-- Seed one table and backfill every existing SalaryGrade row onto it. This is
-- the real "2026 SSL 3rd Tranche - Main" schedule already imported by
-- packages/db/scripts/import-salary-grades.mjs before this migration existed
-- (salaryGradeTableId did not exist yet at import time) — not placeholder data.
INSERT INTO "salary_grade_tables" ("id", "name", "effectiveDate", "description", "updatedAt")
VALUES (
    'sgt_2026_ssl_3rd_tranche_main',
    '2026 SSL 3rd Tranche - Main',
    '2026-09-01T00:00:00.000Z',
    'Legacy SGrade sgrade-no=20, sGradeType=1 (Main) — the schedule already imported before salary grade tables existed.',
    CURRENT_TIMESTAMP
);

-- AlterTable: add nullable first so existing rows aren't rejected
ALTER TABLE "salary_grades" ADD COLUMN "salaryGradeTableId" TEXT;

-- Backfill: every existing grade belongs to the schedule just seeded above
UPDATE "salary_grades" SET "salaryGradeTableId" = 'sgt_2026_ssl_3rd_tranche_main';

-- Now that every row has a value, enforce NOT NULL
ALTER TABLE "salary_grades" ALTER COLUMN "salaryGradeTableId" SET NOT NULL;

-- DropIndex: gradeNo alone is no longer globally unique — it's unique per table
DROP INDEX "salary_grades_gradeNo_key";

-- CreateIndex
CREATE UNIQUE INDEX "salary_grades_salaryGradeTableId_gradeNo_key" ON "salary_grades"("salaryGradeTableId", "gradeNo");

-- AddForeignKey
ALTER TABLE "salary_grades" ADD CONSTRAINT "salary_grades_salaryGradeTableId_fkey" FOREIGN KEY ("salaryGradeTableId") REFERENCES "salary_grade_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Steps now cascade-delete with their grade (deleting a grade or a whole table
-- no longer has to manually clean up steps first)
ALTER TABLE "salary_steps" DROP CONSTRAINT "salary_steps_salaryGradeId_fkey";
ALTER TABLE "salary_steps" ADD CONSTRAINT "salary_steps_salaryGradeId_fkey" FOREIGN KEY ("salaryGradeId") REFERENCES "salary_grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: which schedule an employee is paid off, optional
ALTER TABLE "employees" ADD COLUMN "salaryGradeTableId" TEXT;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_salaryGradeTableId_fkey" FOREIGN KEY ("salaryGradeTableId") REFERENCES "salary_grade_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropTable: salary_grade_effectivities was scaffolded early on, never wired
-- up to any service/controller, and is empty in production — superseded by
-- salary_grade_tables.
ALTER TABLE "salary_grade_effectivities" DROP CONSTRAINT "salary_grade_effectivities_salaryGradeId_fkey";
DROP TABLE "salary_grade_effectivities";
