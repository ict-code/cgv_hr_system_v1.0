-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('AP', 'CT', 'DT', 'EL', 'FT', 'NE', 'OA', 'PR', 'PX', 'RA', 'RC', 'RI', 'RM', 'RN', 'RS', 'RT', 'SA', 'TM', 'TN', 'TO', 'TX');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('REGULAR', 'CASUAL', 'CONTRACTUAL', 'CO_TERMINOUS', 'PROBATIONARY', 'DEVOLVED');

-- CreateEnum
CREATE TYPE "PayMode" AS ENUM ('DAILY', 'WEEKLY', 'SEMI_MONTHLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "WorkLevel" AS ENUM ('FIRST_LEVEL', 'SECOND_LEVEL', 'THIRD_LEVEL');

-- CreateEnum
CREATE TYPE "AppointType" AS ENUM ('REGULAR', 'CASUAL', 'JOB_ORDER', 'CONTRACT_OF_SERVICE', 'CONSULTANT', 'SPECIAL');

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "deptCode" INTEGER NOT NULL,
    "deptDesc" TEXT NOT NULL,
    "shortDesc" TEXT,
    "deptHead" TEXT,
    "certifyName" TEXT,
    "certifyPosition" TEXT,
    "approveName" TEXT,
    "approvePosition" TEXT,
    "fundCode" INTEGER,
    "subCode" TEXT,
    "refCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "divisions" (
    "id" TEXT NOT NULL,
    "divCode" INTEGER NOT NULL,
    "divDesc" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "divisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "positionCode" INTEGER NOT NULL,
    "positionDesc" TEXT NOT NULL,
    "shortDesc" TEXT,
    "positionGroup" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantillas" (
    "id" TEXT NOT NULL,
    "itemNo" TEXT NOT NULL,
    "oldItemNo" TEXT,
    "pageNo" INTEGER,
    "actualSalary" DECIMAL(14,2),
    "authSalary" DECIMAL(14,2),
    "grade" INTEGER,
    "step" INTEGER,
    "partTime" BOOLEAN NOT NULL DEFAULT false,
    "departmentId" TEXT NOT NULL,
    "positionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantillas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_grades" (
    "id" TEXT NOT NULL,
    "gradeNo" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_steps" (
    "id" TEXT NOT NULL,
    "salaryGradeId" TEXT NOT NULL,
    "stepNo" INTEGER NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "monthlyRate" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "salary_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_grade_effectivities" (
    "id" TEXT NOT NULL,
    "effectDate" TIMESTAMP(3) NOT NULL,
    "salaryGradeId" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salary_grade_effectivities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "empNo" INTEGER NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "suffix" TEXT,
    "birthDate" TIMESTAMP(3),
    "birthPlace" TEXT,
    "sex" TEXT,
    "civilStatus" TEXT,
    "nationality" TEXT NOT NULL DEFAULT 'Filipino',
    "fatherName" TEXT,
    "motherName" TEXT,
    "spouseName" TEXT,
    "spouseWork" TEXT,
    "tin" TEXT,
    "gsisNo" TEXT,
    "pagibigNo" TEXT,
    "philhealthNo" TEXT,
    "address" TEXT,
    "telNo" TEXT,
    "cellNo" TEXT,
    "emailAddress" TEXT,
    "bankAccountNo" TEXT,
    "taxStatus" TEXT,
    "dateHired" TIMESTAMP(3),
    "hiredDate" TIMESTAMP(3),
    "appointDate" TIMESTAMP(3),
    "inactive" BOOLEAN NOT NULL DEFAULT false,
    "dateInactivated" TIMESTAMP(3),
    "inactiveCause" TEXT,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dependents" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "age" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dependents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "departmentId" TEXT,
    "positionId" TEXT,
    "itemNo" TEXT,
    "status" "AppointmentStatus",
    "employmentStatus" "EmploymentStatus",
    "appointType" "AppointType",
    "payMode" "PayMode",
    "workLevel" "WorkLevel",
    "authSalary" DECIMAL(14,2),
    "actualSalary" DECIMAL(14,2),
    "monthlyRate" DECIMAL(14,2),
    "effectDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "exitDate" TIMESTAMP(3),
    "exitCause" TEXT,
    "stepNo" INTEGER,
    "grade" INTEGER,
    "rank" INTEGER,
    "taxStatus" TEXT,
    "withTax" DECIMAL(14,2),
    "repAllowance" DECIMAL(14,2),
    "travelAllowance" DECIMAL(14,2),
    "subsAllowance" DECIMAL(14,2),
    "laundryAllowance" DECIMAL(14,2),
    "quarterAllowance" DECIMAL(14,2),
    "pagibigRate" DECIMAL(14,2),
    "coopRate" DECIMAL(14,2),
    "woGsis" BOOLEAN NOT NULL DEFAULT false,
    "woPagibig" BOOLEAN NOT NULL DEFAULT false,
    "woPhilhealth" BOOLEAN NOT NULL DEFAULT false,
    "woWtax" BOOLEAN NOT NULL DEFAULT false,
    "woPera" BOOLEAN NOT NULL DEFAULT false,
    "woCaa" BOOLEAN NOT NULL DEFAULT false,
    "woCoop" BOOLEAN NOT NULL DEFAULT false,
    "woSif" BOOLEAN NOT NULL DEFAULT false,
    "exemptPagibig" BOOLEAN NOT NULL DEFAULT false,
    "withRata" BOOLEAN NOT NULL DEFAULT false,
    "vouchered" BOOLEAN NOT NULL DEFAULT false,
    "partTime" BOOLEAN NOT NULL DEFAULT false,
    "partTimePercent" DECIMAL(5,2),
    "vlBalance" DECIMAL(10,2),
    "slBalance" DECIMAL(10,3),
    "sMode" INTEGER,
    "groupNo" INTEGER,
    "assignCode" INTEGER,
    "localityCode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_change_logs" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "effectDate" TIMESTAMP(3) NOT NULL,
    "oldDeptCode" INTEGER,
    "oldPositionCode" INTEGER,
    "oldActlSalary" DECIMAL(14,2),
    "oldMonthlyRate" DECIMAL(14,2),
    "oldItemNo" TEXT,
    "oldStatusCode" TEXT,
    "oldEmpStatus" TEXT,
    "oldGrade" INTEGER,
    "oldStep" INTEGER,
    "deptCode" INTEGER,
    "positionCode" INTEGER,
    "actlSalary" DECIMAL(14,2),
    "monthlyRate" DECIMAL(14,2),
    "itemNo" TEXT,
    "statusCode" TEXT,
    "empStatus" TEXT,
    "grade" INTEGER,
    "step" INTEGER,
    "efficiencyRate" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_records" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "positionSnapshot" TEXT,
    "departmentSnapshot" TEXT,
    "divisionSnapshot" TEXT,
    "empStatusSnapshot" TEXT,
    "salarySnapshot" DECIMAL(14,2),
    "salaryUnitSnapshot" TEXT,
    "grade" INTEGER,
    "step" INTEGER,
    "itemNo" TEXT,
    "exitDate" TIMESTAMP(3),
    "exitCause" TEXT,
    "leaveAbsence" TEXT,
    "remarks" TEXT,
    "signatory" TEXT,
    "signPosition" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "loginId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_deptCode_key" ON "departments"("deptCode");

-- CreateIndex
CREATE UNIQUE INDEX "divisions_divCode_key" ON "divisions"("divCode");

-- CreateIndex
CREATE UNIQUE INDEX "positions_positionCode_key" ON "positions"("positionCode");

-- CreateIndex
CREATE UNIQUE INDEX "plantillas_itemNo_key" ON "plantillas"("itemNo");

-- CreateIndex
CREATE UNIQUE INDEX "salary_grades_gradeNo_key" ON "salary_grades"("gradeNo");

-- CreateIndex
CREATE UNIQUE INDEX "salary_steps_salaryGradeId_stepNo_key" ON "salary_steps"("salaryGradeId", "stepNo");

-- CreateIndex
CREATE UNIQUE INDEX "employees_empNo_key" ON "employees"("empNo");

-- CreateIndex
CREATE INDEX "appointments_employeeId_effectDate_idx" ON "appointments"("employeeId", "effectDate");

-- CreateIndex
CREATE INDEX "appointments_departmentId_itemNo_idx" ON "appointments"("departmentId", "itemNo");

-- CreateIndex
CREATE INDEX "appointment_change_logs_employeeId_year_effectDate_idx" ON "appointment_change_logs"("employeeId", "year", "effectDate");

-- CreateIndex
CREATE INDEX "service_records_employeeId_startDate_idx" ON "service_records"("employeeId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "users_loginId_key" ON "users"("loginId");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeId_key" ON "users"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_module_action_key" ON "permissions"("module", "action");

-- CreateIndex
CREATE INDEX "audit_logs_module_createdAt_idx" ON "audit_logs"("module", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "divisions" ADD CONSTRAINT "divisions_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantillas" ADD CONSTRAINT "plantillas_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantillas" ADD CONSTRAINT "plantillas_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_steps" ADD CONSTRAINT "salary_steps_salaryGradeId_fkey" FOREIGN KEY ("salaryGradeId") REFERENCES "salary_grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_grade_effectivities" ADD CONSTRAINT "salary_grade_effectivities_salaryGradeId_fkey" FOREIGN KEY ("salaryGradeId") REFERENCES "salary_grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependents" ADD CONSTRAINT "dependents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_change_logs" ADD CONSTRAINT "appointment_change_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
