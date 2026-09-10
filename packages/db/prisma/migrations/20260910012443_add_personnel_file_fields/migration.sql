-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "addrBarangay" TEXT,
ADD COLUMN     "addrBlockNo" TEXT,
ADD COLUMN     "addrLocality" TEXT,
ADD COLUMN     "addrLot" TEXT,
ADD COLUMN     "addrPhase" TEXT,
ADD COLUMN     "addrProvince" TEXT,
ADD COLUMN     "addrStreet" TEXT,
ADD COLUMN     "addrTelNo" TEXT,
ADD COLUMN     "addrUnitNo" TEXT,
ADD COLUMN     "addrZip" TEXT,
ADD COLUMN     "biometricId" TEXT,
ADD COLUMN     "bloodType" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "divisionId" TEXT,
ADD COLUMN     "fatherBirthPlace" TEXT,
ADD COLUMN     "height" DECIMAL(5,2),
ADD COLUMN     "idNo" TEXT,
ADD COLUMN     "jobDescription" TEXT,
ADD COLUMN     "motherBirthPlace" TEXT,
ADD COLUMN     "permanentAddress" TEXT,
ADD COLUMN     "permanentTelNo" TEXT,
ADD COLUMN     "permanentZipCode" TEXT,
ADD COLUMN     "pwdType" TEXT,
ADD COLUMN     "religion" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "validated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "validatedBy" TEXT,
ADD COLUMN     "validatedDate" TIMESTAMP(3),
ADD COLUMN     "weight" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "employee_education" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "schoolYear" TEXT,
    "course" TEXT,
    "degree" TEXT,
    "honors" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_eligibility" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "examName" TEXT NOT NULL,
    "examDate" TIMESTAMP(3),
    "examPlace" TEXT,
    "rating" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_eligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_work_experience" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "salary" DECIMAL(14,2),
    "salaryUnit" TEXT,
    "employmentStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_work_experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_training" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "trainingName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "conductor" TEXT,
    "periodCovered" TEXT,
    "numberOfHours" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_skills" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_skills_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_education" ADD CONSTRAINT "employee_education_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_eligibility" ADD CONSTRAINT "employee_eligibility_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_work_experience" ADD CONSTRAINT "employee_work_experience_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_training" ADD CONSTRAINT "employee_training_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_skills" ADD CONSTRAINT "employee_skills_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
