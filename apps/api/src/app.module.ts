import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { IdempotencyInterceptor } from './common/idempotency/idempotency.interceptor.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthController } from './health/health.controller.js';
import { EmployeesModule } from './employees/employees.module.js';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { DepartmentsModule } from './departments/departments.module.js';
import { PositionsModule } from './positions/positions.module.js';
import { AppointmentsModule } from './appointments/appointments.module.js';
import { UsersModule } from './users/users.module.js';
import { RolesModule } from './roles/roles.module.js';
import { PlantillaModule } from './plantilla/plantilla.module.js';
import { SalaryGradesModule } from './salary-grades/salary-grades.module.js';
import { SalaryGradeTablesModule } from './salary-grade-tables/salary-grade-tables.module.js';
import { PersonnelRecordsModule } from './personnel-records/personnel-records.module.js';
import { AppointmentStatusesModule } from './appointment-statuses/appointment-statuses.module.js';
import { EmploymentStatusesModule } from './employment-statuses/employment-statuses.module.js';
import { ServiceRecordExportModule } from './service-record-export/service-record-export.module.js';
import { ServiceRecordsModule } from './service-records/service-records.module.js';
import { PdsExportModule } from './pds-export/pds-export.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,
    AuthModule,
    DepartmentsModule,
    PositionsModule,
    EmployeesModule,
    AppointmentsModule,
    UsersModule,
    RolesModule,
    PlantillaModule,
    SalaryGradesModule,
    SalaryGradeTablesModule,
    PersonnelRecordsModule,
    AppointmentStatusesModule,
    EmploymentStatusesModule,
    ServiceRecordExportModule,
    ServiceRecordsModule,
    PdsExportModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor }],
})
export class AppModule {}
