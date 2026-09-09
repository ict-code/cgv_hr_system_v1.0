import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
  ],
  controllers: [HealthController],
})
export class AppModule {}
