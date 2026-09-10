import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { ListQueryDto } from '../common/dto/list-query.dto.js';
import { PlantillaService } from './plantilla.service.js';
import { CreatePlantillaDto } from './dto/create-plantilla.dto.js';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('plantilla')
export class PlantillaController {
  constructor(private readonly plantilla: PlantillaService) {}

  @Get()
  findAll(@Query() query: ListQueryDto) {
    return this.plantilla.findAll(query);
  }

  @RequirePermissions('plantilla:create')
  @Post()
  create(@Body() dto: CreatePlantillaDto) {
    return this.plantilla.create(dto);
  }
}
