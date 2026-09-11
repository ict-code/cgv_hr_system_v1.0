import { Body, Controller, Param, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { ServiceRecordExportService } from './service-record-export.service.js';
import { ExportServiceRecordDto } from './dto/export-service-record.dto.js';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('employees/:employeeId')
export class ServiceRecordExportController {
  constructor(private readonly service: ServiceRecordExportService) {}

  @Post('service-record/export')
  async export(
    @Param('employeeId') employeeId: string,
    @Body() dto: ExportServiceRecordDto,
    @Res() res: Response,
  ) {
    const buffer = await this.service.export(employeeId, dto);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="service-record.docx"',
    });
    res.send(buffer);
  }
}
