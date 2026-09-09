import { Module } from '@nestjs/common';
import { SalaryGradesController } from './salary-grades.controller.js';
import { SalaryGradesService } from './salary-grades.service.js';

@Module({
  controllers: [SalaryGradesController],
  providers: [SalaryGradesService],
})
export class SalaryGradesModule {}
