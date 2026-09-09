import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AppointmentsService } from './appointments.service.js';
import { RecordAppointmentChangeDto } from './dto/record-appointment-change.dto.js';

@UseGuards(JwtAuthGuard)
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
}
