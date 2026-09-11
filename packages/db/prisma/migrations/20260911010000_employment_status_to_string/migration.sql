-- AlterTable: cast in place instead of drop+recreate (Prisma's own diff
-- would drop the column and lose the 1,168 real rows already carrying a
-- value) — existing enum values (REGULAR/CASUAL/CONTRACTUAL/CO_TERMINOUS)
-- become their literal text equivalents, then get corrected to the real
-- underlying EmployType code by packages/db/scripts/backfill-employment-status.mjs
-- run right after this migration.
ALTER TABLE "appointments" ALTER COLUMN "employmentStatus" TYPE TEXT USING "employmentStatus"::TEXT;

-- DropEnum
DROP TYPE "EmploymentStatus";
