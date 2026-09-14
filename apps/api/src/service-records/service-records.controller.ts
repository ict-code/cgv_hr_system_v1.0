import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.service.js';
import { AuditService } from '../audit/audit.service.js';
import { ServiceRecordsService } from './service-records.service.js';
import { ImportAllServiceRecordsDto } from './dto/import-all-service-records.dto.js';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('service-records')
export class ServiceRecordsController {
  constructor(
    private readonly serviceRecords: ServiceRecordsService,
    private readonly audit: AuditService,
  ) {}

  @RequirePermissions('personnel:edit')
  @Post('import')
  async importAll(@Body() dto: ImportAllServiceRecordsDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.serviceRecords.importAll(dto.records);

    await this.audit.log({
      userId: user.id,
      module: 'service-records',
      action: 'import-all',
      description: `Imported ${result.imported} service record(s) via all-employees CSV upload (${result.unmatchedEmpNos.length} unmatched Employee No.)`,
      outcome: 'success',
    });

    return result;
  }
}
