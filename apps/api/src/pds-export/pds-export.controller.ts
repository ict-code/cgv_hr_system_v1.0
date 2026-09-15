import { Controller, Param, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { PdsExportService } from './pds-export.service.js';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('employees/:employeeId')
export class PdsExportController {
  constructor(private readonly service: PdsExportService) {}

  @Post('pds/export')
  async export(@Param('employeeId') employeeId: string, @Res() res: Response) {
    const buffer = await this.service.export(employeeId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="pds.xlsx"',
    });
    res.send(buffer);
  }
}
