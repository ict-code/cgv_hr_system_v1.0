import { Injectable } from '@nestjs/common';
import type { Prisma, Position } from '@egaps/db';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreatePositionDto } from './dto/create-position.dto.js';
import type { ListQueryDto, PaginatedResult } from '../common/dto/list-query.dto.js';

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListQueryDto): Promise<PaginatedResult<Position>> {
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

    return { data, total, page: query.page, pageSize: query.pageSize };
  }

  create(dto: CreatePositionDto) {
    return this.prisma.position.create({ data: dto });
  }
}
