import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { ListQueryDto } from '../common/dto/list-query.dto.js';
import { EmploymentStatusesService } from './employment-statuses.service.js';
import { CreateEmploymentStatusDto } from './dto/create-employment-status.dto.js';
import { UpdateEmploymentStatusDto } from './dto/update-employment-status.dto.js';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('employment-statuses')
export class EmploymentStatusesController {
  constructor(private readonly employmentStatuses: EmploymentStatusesService) {}

  @Get()
  findAll(@Query() query: ListQueryDto) {
    return this.employmentStatuses.findAll(query);
  }

  @RequirePermissions('employmentStatuses:create')
  @Post()
  create(@Body() dto: CreateEmploymentStatusDto) {
    return this.employmentStatuses.create(dto);
  }

  @RequirePermissions('employmentStatuses:edit')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmploymentStatusDto) {
    return this.employmentStatuses.update(id, dto);
  }

  @RequirePermissions('employmentStatuses:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employmentStatuses.remove(id);
  }
}
