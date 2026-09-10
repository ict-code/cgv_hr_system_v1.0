import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { ListQueryDto } from '../common/dto/list-query.dto.js';
import { SalaryGradeTablesService } from './salary-grade-tables.service.js';
import { CreateSalaryGradeTableDto } from './dto/create-salary-grade-table.dto.js';
import { UpdateSalaryGradeTableDto } from './dto/update-salary-grade-table.dto.js';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('salary-grade-tables')
export class SalaryGradeTablesController {
  constructor(private readonly salaryGradeTables: SalaryGradeTablesService) {}

  @Get()
  findAll(@Query() query: ListQueryDto) {
    return this.salaryGradeTables.findAll(query);
  }

  @RequirePermissions('salaryGrades:create')
  @Post()
  create(@Body() dto: CreateSalaryGradeTableDto) {
    return this.salaryGradeTables.create(dto);
  }

  @RequirePermissions('salaryGrades:edit')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSalaryGradeTableDto) {
    return this.salaryGradeTables.update(id, dto);
  }

  @RequirePermissions('salaryGrades:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.salaryGradeTables.remove(id);
  }
}
