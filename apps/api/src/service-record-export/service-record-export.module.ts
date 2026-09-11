import { Module } from '@nestjs/common';
import { ServiceRecordExportController } from './service-record-export.controller.js';
import { ServiceRecordExportService } from './service-record-export.service.js';

@Module({
  controllers: [ServiceRecordExportController],
  providers: [ServiceRecordExportService],
})
export class ServiceRecordExportModule {}
