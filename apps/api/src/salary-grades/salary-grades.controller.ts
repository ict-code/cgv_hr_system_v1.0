import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { SalaryGradesService } from './salary-grades.service.js';
import { CreateSalaryGradeDto } from './dto/create-salary-grade.dto.js';
import { UpdateSalaryStepDto } from './dto/update-salary-step.dto.js';
import { ListSalaryGradesDto } from './dto/list-salary-grades.dto.js';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('salary-grades')
export class SalaryGradesController {
  constructor(private readonly salaryGrades: SalaryGradesService) {}

  @Get()
  findAll(@Query() query: ListSalaryGradesDto) {
    return this.salaryGrades.findAll(query);
  }

  @RequirePermissions('salaryGrades:create')
  @Post()
  create(@Body() dto: CreateSalaryGradeDto) {
    return this.salaryGrades.create(dto);
  }

  @RequirePermissions('salaryGrades:edit')
  @Patch(':id/steps/:stepNo')
  updateStep(
    @Param('id') id: string,
    @Param('stepNo', ParseIntPipe) stepNo: number,
    @Body() dto: UpdateSalaryStepDto,
  ) {
    return this.salaryGrades.updateStep(id, stepNo, dto);
  }

  @RequirePermissions('salaryGrades:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.salaryGrades.remove(id);
  }
}
