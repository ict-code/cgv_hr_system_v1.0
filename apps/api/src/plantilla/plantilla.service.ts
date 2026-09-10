import { Injectable } from '@nestjs/common';
import type { Prisma, Plantilla } from '@egaps/db';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreatePlantillaDto } from './dto/create-plantilla.dto.js';
import type { ListQueryDto, PaginatedResult } from '../common/dto/list-query.dto.js';

@Injectable()
export class PlantillaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListQueryDto): Promise<PaginatedResult<Plantilla>> {
    const where: Prisma.PlantillaWhereInput = query.search
      ? { itemNo: { contains: query.search, mode: 'insensitive' } }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.plantilla.findMany({
        where,
        include: { department: true, position: true },
        orderBy: { itemNo: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.plantilla.count({ where }),
    ]);

    return { data, total, page: query.page, pageSize: query.pageSize };
  }

  create(dto: CreatePlantillaDto) {
    return this.prisma.plantilla.create({
      data: dto,
      include: { department: true, position: true },
    });
  }
}
