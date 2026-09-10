import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { Prisma } from '@egaps/db';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import type { ListQueryDto, PaginatedResult } from '../common/dto/list-query.dto.js';

const USER_LIST_SELECT = {
  id: true,
  loginId: true,
  fullName: true,
  active: true,
  createdAt: true,
  roles: { include: { role: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListQueryDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.UserWhereInput = query.search
      ? {
          OR: [
            { loginId: { contains: query.search, mode: 'insensitive' } },
            { fullName: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_LIST_SELECT,
        orderBy: { fullName: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page: query.page, pageSize: query.pageSize };
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { loginId: dto.loginId, passwordHash, fullName: dto.fullName },
      });

      if (dto.roleIds.length > 0) {
        await tx.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({ userId: user.id, roleId })),
        });
      }

      return tx.user.findUniqueOrThrow({ where: { id: user.id }, select: USER_LIST_SELECT });
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : undefined;

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          fullName: dto.fullName,
          active: dto.active,
          ...(passwordHash ? { passwordHash } : {}),
        },
      });

      if (dto.roleIds) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        if (dto.roleIds.length > 0) {
          await tx.userRole.createMany({ data: dto.roleIds.map((roleId) => ({ userId: id, roleId })) });
        }
      }

      return tx.user.findUniqueOrThrow({ where: { id }, select: USER_LIST_SELECT });
    });
  }
}
