import { Module } from '@nestjs/common';
import { SalaryGradeTablesController } from './salary-grade-tables.controller.js';
import { SalaryGradeTablesService } from './salary-grade-tables.service.js';

@Module({
  controllers: [SalaryGradeTablesController],
  providers: [SalaryGradeTablesService],
})
export class SalaryGradeTablesModule {}
