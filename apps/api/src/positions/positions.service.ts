import { Injectable } from '@nestjs/common';
import type { Prisma, Position } from '@egaps/db';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreatePositionDto } from './dto/create-position.dto.js';
import type { ListQueryDto, PaginatedResult } from '../common/dto/list-query.dto.js';
import { TtlCache } from '../common/cache/ttl-cache.js';

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Same reasoning as DepartmentsService's cache: Positions has no
  // update/delete, is fetched on nearly every page for dropdowns, and is
  // 768 rows of mostly-static master data.
  private readonly cache = new TtlCache<PaginatedResult<Position>>(30_000);

  async findAll(query: ListQueryDto): Promise<PaginatedResult<Position>> {
    const cacheKey = JSON.stringify(query);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const where: Prisma.PositionWhereInput = query.search
      ? {
          OR: [
            { positionDesc: { contains: query.search, mode: 'insensitive' } },
            { shortDesc: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.position.findMany({
        where,
        orderBy: { positionDesc: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.position.count({ where }),
    ]);

    const result = { data, total, page: query.page, pageSize: query.pageSize };
    this.cache.set(cacheKey, result);
    return result;
  }

  async create(dto: CreatePositionDto) {
    const created = await this.prisma.position.create({ data: dto });
    this.cache.clear();
    return created;
  }
}
