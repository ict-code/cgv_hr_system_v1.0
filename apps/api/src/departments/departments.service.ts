import { Injectable } from '@nestjs/common';
import type { Prisma, Department } from '@egaps/db';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateDepartmentDto } from './dto/create-department.dto.js';
import type { ListQueryDto, PaginatedResult } from '../common/dto/list-query.dto.js';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListQueryDto): Promise<PaginatedResult<Department>> {
    const where: Prisma.DepartmentWhereInput = query.search
      ? {
          OR: [
            { deptDesc: { contains: query.search, mode: 'insensitive' } },
            { shortDesc: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        orderBy: { deptDesc: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.department.count({ where }),
    ]);

    return { data, total, page: query.page, pageSize: query.pageSize };
  }

  create(dto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: dto });
  }
}
