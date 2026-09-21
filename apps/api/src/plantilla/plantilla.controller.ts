import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.service.js';
import { AuditService } from '../audit/audit.service.js';
import { PlantillaService } from './plantilla.service.js';
import { AppointEmployeeDto } from './dto/appoint-employee.dto.js';
import { CreatePlantillaDto } from './dto/create-plantilla.dto.js';
import { UpdatePlantillaDto } from './dto/update-plantilla.dto.js';
import { ListPlantillaDto } from './dto/list-plantilla.dto.js';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('plantilla')
export class PlantillaController {
  constructor(
    private readonly plantilla: PlantillaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  findAll(@Query() query: ListPlantillaDto) {
    return this.plantilla.findAll(query);
  }

  @RequirePermissions('plantilla:create')
  @Post()
  create(@Body() dto: CreatePlantillaDto) {
    return this.plantilla.create(dto);
  }

  @RequirePermissions('personnel:edit', 'plantilla:edit')
  @Post(':id/appoint-employee')
  async appointEmployee(
    @Param('id') id: string,
    @Body() dto: AppointEmployeeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.plantilla.appointEmployee(id, dto, user);
    await this.audit.log({
      userId: user.id,
      module: 'plantilla',
      action: 'appoint-employee',
      description: `Appointed employee ${dto.employeeId} to plantilla item ${id}, status=${dto.status}, effectDate=${dto.effectDate.toISOString().slice(0, 10)}`,
      outcome: 'success',
    });
    return result;
  }

  @RequirePermissions('plantilla:edit')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlantillaDto) {
    return this.plantilla.update(id, dto);
  }

  @RequirePermissions('plantilla:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.plantilla.remove(id);
  }
}
