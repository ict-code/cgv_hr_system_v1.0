import { Injectable } from '@nestjs/common';
import type { Prisma } from '@egaps/db';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateRoleDto } from './dto/create-role.dto.js';
import type { ListQueryDto, PaginatedResult } from '../common/dto/list-query.dto.js';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListQueryDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.RoleWhereInput = query.search
      ? { name: { contains: query.search, mode: 'insensitive' } }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        include: { permissions: { include: { permission: true } } },
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.role.count({ where }),
    ]);

    return { data, total, page: query.page, pageSize: query.pageSize };
  }

  findAllPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] });
  }

  create(dto: CreateRoleDto) {
    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: { name: dto.name, description: dto.description },
      });

      if (dto.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
        });
      }

      return tx.role.findUniqueOrThrow({
        where: { id: role.id },
        include: { permissions: { include: { permission: true } } },
      });
    });
  }
}
