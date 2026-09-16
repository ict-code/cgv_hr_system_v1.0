import { Injectable } from '@nestjs/common';
import type { Prisma, Department } from '@egaps/db';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateDepartmentDto } from './dto/create-department.dto.js';
import type { ListQueryDto, PaginatedResult } from '../common/dto/list-query.dto.js';
import { TtlCache } from '../common/cache/ttl-cache.js';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  // Departments has no update/delete (legacy-imported, HR-edited only via
  // `create` today) and is fetched on nearly every page for dropdowns/badges
  // — read-heavy, write-rare, exactly the case an in-process cache suits.
  // 30s is generous enough to skip repeat DB round trips across normal
  // navigation while staying well inside how fresh master data needs to be.
  private readonly cache = new TtlCache<PaginatedResult<Department>>(30_000);

  async findAll(query: ListQueryDto): Promise<PaginatedResult<Department>> {
    const cacheKey = JSON.stringify(query);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

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

    const result = { data, total, page: query.page, pageSize: query.pageSize };
    this.cache.set(cacheKey, result);
    return result;
  }

  async create(dto: CreateDepartmentDto) {
    const created = await this.prisma.department.create({ data: dto });
    this.cache.clear();
    return created;
  }
}
