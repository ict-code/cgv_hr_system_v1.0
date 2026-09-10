import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { ListQueryDto } from '../common/dto/list-query.dto.js';
import { DepartmentsService } from './departments.service.js';
import { CreateDepartmentDto } from './dto/create-department.dto.js';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  @Get()
  findAll(@Query() query: ListQueryDto) {
    return this.departments.findAll(query);
  }

  @RequirePermissions('departments:create')
  @Post()
  create(@Body() dto: CreateDepartmentDto) {
    return this.departments.create(dto);
  }
}
