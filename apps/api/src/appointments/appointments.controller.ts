import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AppointmentsService } from './appointments.service.js';
import { RecordAppointmentChangeDto } from './dto/record-appointment-change.dto.js';
import { CreateServiceRecordDto } from './dto/create-service-record.dto.js';
import { ImportServiceRecordsDto } from './dto/import-service-records.dto.js';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('employees/:employeeId')
export class AppointmentsController {
  constructor(
    private readonly appointments: AppointmentsService,
    private readonly audit: AuditService,
  ) {}

  @Get('appointments')
  findAppointments(@Param('employeeId') employeeId: string) {
    return this.appointments.findAppointments(employeeId);
  }

  @Get('change-logs')
  findChangeLogs(@Param('employeeId') employeeId: string) {
    return this.appointments.findChangeLogs(employeeId);
  }

  @Get('service-records')
  findServiceRecords(@Param('employeeId') employeeId: string) {
    return this.appointments.findServiceRecords(employeeId);
  }

  @RequirePermissions('personnel:edit')
  @Post('service-records')
  async createServiceRecord(
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateServiceRecordDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.appointments.createServiceRecord(employeeId, dto);

    await this.audit.log({
      userId: user.id,
      module: 'service-records',
      action: 'create',
      description: `Added service record for employee ${employeeId}: ${dto.startDate.toISOString().slice(0, 10)}`,
      outcome: 'success',
    });

    return result;
  }

  @RequirePermissions('personnel:edit')
  @Post('service-records/import')
  async importServiceRecords(
    @Param('employeeId') employeeId: string,
    @Body() dto: ImportServiceRecordsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.appointments.importServiceRecords(employeeId, dto.records);

    await this.audit.log({
      userId: user.id,
      module: 'service-records',
      action: 'import',
      description: `Imported ${result.imported} service record(s) via CSV for employee ${employeeId}`,
      outcome: 'success',
    });

    return result;
  }

  @RequirePermissions('personnel:edit')
  @Post('appointments')
  async recordChange(
    @Param('employeeId') employeeId: string,
    @Body() dto: RecordAppointmentChangeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.appointments.recordChange(employeeId, dto, user);

    await this.audit.log({
      userId: user.id,
      module: 'appointments',
      action: 'record-change',
      description: `Recorded appointment change for employee ${employeeId}: status=${dto.status}, effectDate=${dto.effectDate.toISOString().slice(0, 10)}`,
      outcome: 'success',
    });

    return result;
  }

  @RequirePermissions('personnel:edit')
  @Delete('appointments')
  async removeCurrent(@Param('employeeId') employeeId: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.appointments.removeCurrent(employeeId);

    await this.audit.log({
      userId: user.id,
      module: 'appointments',
      action: 'delete-current',
      description: `Deleted current appointment for employee ${employeeId}`,
      outcome: 'success',
    });

    return result;
  }
}
