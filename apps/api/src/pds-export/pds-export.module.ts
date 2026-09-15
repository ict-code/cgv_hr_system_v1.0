import { Module } from '@nestjs/common';
import { PdsExportController } from './pds-export.controller.js';
import { PdsExportService } from './pds-export.service.js';

@Module({
  controllers: [PdsExportController],
  providers: [PdsExportService],
})
export class PdsExportModule {}
