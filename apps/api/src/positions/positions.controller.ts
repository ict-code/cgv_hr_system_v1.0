import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { PositionsService } from './positions.service.js';
import { CreatePositionDto } from './dto/create-position.dto.js';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('positions')
export class PositionsController {
  constructor(private readonly positions: PositionsService) {}

  @Get()
  findAll() {
    return this.positions.findAll();
  }

  @RequirePermissions('positions:create')
  @Post()
  create(@Body() dto: CreatePositionDto) {
    return this.positions.create(dto);
  }
}
