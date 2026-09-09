import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { RolesService } from './roles.service.js';
import { CreateRoleDto } from './dto/create-role.dto.js';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @RequirePermissions('roles:view')
  @Get()
  findAll() {
    return this.roles.findAll();
  }

  @RequirePermissions('roles:create')
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.roles.create(dto);
  }
}

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly roles: RolesService) {}

  @RequirePermissions('roles:view')
  @Get()
  findAll() {
    return this.roles.findAllPermissions();
  }
}
