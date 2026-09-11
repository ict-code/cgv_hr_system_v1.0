import { Injectable } from '@nestjs/common';
import type { Prisma, EmploymentStatusCode } from '@egaps/db';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateEmploymentStatusDto } from './dto/create-employment-status.dto.js';
import type { UpdateEmploymentStatusDto } from './dto/update-employment-status.dto.js';
import type { ListQueryDto, PaginatedResult } from '../common/dto/list-query.dto.js';

@Injectable()
export class EmploymentStatusesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListQueryDto): Promise<PaginatedResult<EmploymentStatusCode>> {
    const where: Prisma.EmploymentStatusCodeWhereInput = query.search
      ? {
          OR: [
            { code: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.employmentStatusCode.findMany({
        where,
        orderBy: { code: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.employmentStatusCode.count({ where }),
    ]);

    return { data, total, page: query.page, pageSize: query.pageSize };
  }

  create(dto: CreateEmploymentStatusDto) {
    return this.prisma.employmentStatusCode.create({ data: dto });
  }

  update(id: string, dto: UpdateEmploymentStatusDto) {
    return this.prisma.employmentStatusCode.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.employmentStatusCode.delete({ where: { id } });
  }
}
