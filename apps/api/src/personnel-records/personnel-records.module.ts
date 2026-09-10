import { Module } from '@nestjs/common';
import { PersonnelRecordsController } from './personnel-records.controller.js';
import { PersonnelRecordsService } from './personnel-records.service.js';

@Module({
  controllers: [PersonnelRecordsController],
  providers: [PersonnelRecordsService],
})
export class PersonnelRecordsModule {}
