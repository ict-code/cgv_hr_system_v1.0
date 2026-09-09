-- AlterTable
ALTER TABLE "appointment_change_logs" ADD COLUMN     "changedByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "appointment_change_logs" ADD CONSTRAINT "appointment_change_logs_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
