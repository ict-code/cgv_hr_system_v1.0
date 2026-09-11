import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { PlantillaService } from './plantilla.service.js';
import { CreatePlantillaDto } from './dto/create-plantilla.dto.js';
import { UpdatePlantillaDto } from './dto/update-plantilla.dto.js';
import { ListPlantillaDto } from './dto/list-plantilla.dto.js';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('plantilla')
export class PlantillaController {
  constructor(private readonly plantilla: PlantillaService) {}

  @Get()
  findAll(@Query() query: ListPlantillaDto) {
    return this.plantilla.findAll(query);
  }

  @RequirePermissions('plantilla:create')
  @Post()
  create(@Body() dto: CreatePlantillaDto) {
    return this.plantilla.create(dto);
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
