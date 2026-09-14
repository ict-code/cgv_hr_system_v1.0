import { Module } from '@nestjs/common';
import { ServiceRecordsController } from './service-records.controller.js';
import { ServiceRecordsService } from './service-records.service.js';

@Module({
  controllers: [ServiceRecordsController],
  providers: [ServiceRecordsService],
})
export class ServiceRecordsModule {}
