import { Module } from '@nestjs/common';
import { EmploymentStatusesController } from './employment-statuses.controller.js';
import { EmploymentStatusesService } from './employment-statuses.service.js';

@Module({
  controllers: [EmploymentStatusesController],
  providers: [EmploymentStatusesService],
})
export class EmploymentStatusesModule {}
