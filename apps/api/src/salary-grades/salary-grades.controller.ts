import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { ListQueryDto } from '../common/dto/list-query.dto.js';
import { SalaryGradesService } from './salary-grades.service.js';
import { CreateSalaryGradeDto } from './dto/create-salary-grade.dto.js';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('salary-grades')
export class SalaryGradesController {
  constructor(private readonly salaryGrades: SalaryGradesService) {}

  @Get()
  findAll(@Query() query: ListQueryDto) {
    return this.salaryGrades.findAll(query);
  }

  @RequirePermissions('salaryGrades:create')
  @Post()
  create(@Body() dto: CreateSalaryGradeDto) {
    return this.salaryGrades.create(dto);
  }
}
