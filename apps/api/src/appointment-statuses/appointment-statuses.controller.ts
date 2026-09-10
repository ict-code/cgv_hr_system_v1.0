import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { ListQueryDto } from '../common/dto/list-query.dto.js';
import { AppointmentStatusesService } from './appointment-statuses.service.js';
import { CreateAppointmentStatusDto } from './dto/create-appointment-status.dto.js';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto.js';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('appointment-statuses')
export class AppointmentStatusesController {
  constructor(private readonly appointmentStatuses: AppointmentStatusesService) {}

  @Get()
  findAll(@Query() query: ListQueryDto) {
    return this.appointmentStatuses.findAll(query);
  }

  @RequirePermissions('appointmentStatuses:create')
  @Post()
  create(@Body() dto: CreateAppointmentStatusDto) {
    return this.appointmentStatuses.create(dto);
  }

  @RequirePermissions('appointmentStatuses:edit')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) {
    return this.appointmentStatuses.update(id, dto);
  }

  @RequirePermissions('appointmentStatuses:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentStatuses.remove(id);
  }
}
