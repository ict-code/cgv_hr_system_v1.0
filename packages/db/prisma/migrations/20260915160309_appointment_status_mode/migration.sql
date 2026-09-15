-- Appointment Status File: HR-editable Entry/Exit classification, replacing
-- the hardcoded status sets previously baked into app code (badge colors,
-- the Employee.inactive auto-sync).
CREATE TYPE "AppointmentStatusMode" AS ENUM ('ENTRY', 'EXIT');
ALTER TABLE "appointment_status_codes" ADD COLUMN "mode" "AppointmentStatusMode";

-- Seed from the analysis already encoded in the app today (badge.tsx's
-- INACTIVE_APPOINTMENT_STATUSES / NEW_APPOINTMENT_STATUSES sets, and
-- appointments.service.ts's EMPLOYEE_INACTIVATING_STATUSES). Everything else
-- (lateral changes like Promotion/Salary Adjustment, and the dozen legacy
-- codes with no confirmed meaning) stays unclassified for HR to set later.
UPDATE "appointment_status_codes" SET "mode" = 'EXIT' WHERE "code" IN ('DT', 'RS', 'RT', 'TO');
UPDATE "appointment_status_codes" SET "mode" = 'ENTRY' WHERE "code" IN ('AP', 'NE', 'OA', 'EL', 'RA', 'RI', 'RM', 'RN', 'TN');
