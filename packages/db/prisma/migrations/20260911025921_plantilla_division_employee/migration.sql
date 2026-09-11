-- AlterTable
ALTER TABLE "plantillas" ADD COLUMN     "divisionId" TEXT,
ADD COLUMN     "employeeId" TEXT;

-- AddForeignKey
ALTER TABLE "plantillas" ADD CONSTRAINT "plantillas_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantillas" ADD CONSTRAINT "plantillas_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
