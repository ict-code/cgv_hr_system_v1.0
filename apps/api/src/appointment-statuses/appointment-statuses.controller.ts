import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { AppointmentStatusesService } from './appointment-statuses.service.js';
import { CreateAppointmentStatusDto } from './dto/create-appointment-status.dto.js';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('appointment-statuses')
export class AppointmentStatusesController {
  constructor(private readonly appointmentStatuses: AppointmentStatusesService) {}

  @Get()
  findAll() {
    return this.appointmentStatuses.findAll();
  }

  @RequirePermissions('appointmentStatuses:create')
  @Post()
  create(@Body() dto: CreateAppointmentStatusDto) {
    return this.appointmentStatuses.create(dto);
  }
}
