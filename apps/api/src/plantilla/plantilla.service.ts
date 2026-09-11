import { Injectable } from '@nestjs/common';
import type { Prisma, Plantilla } from '@egaps/db';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreatePlantillaDto } from './dto/create-plantilla.dto.js';
import type { UpdatePlantillaDto } from './dto/update-plantilla.dto.js';
import type { ListPlantillaDto } from './dto/list-plantilla.dto.js';
import type { PaginatedResult } from '../common/dto/list-query.dto.js';

const ORDER_BY: Record<NonNullable<ListPlantillaDto['sort']>, Prisma.PlantillaOrderByWithRelationInput> = {
  itemNo: { itemNo: 'asc' },
  employeeName: { employee: { lastName: 'asc' } },
  division: { division: { divDesc: 'asc' } },
  salary: { authSalary: 'desc' },
  grade: { grade: 'desc' },
};

@Injectable()
export class PlantillaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListPlantillaDto): Promise<PaginatedResult<Plantilla>> {
    const where: Prisma.PlantillaWhereInput = {
      ...(query.search ? { itemNo: { contains: query.search, mode: 'insensitive' } } : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.plantilla.findMany({
        where,
        include: { department: true, position: true, division: true, employee: true },
        orderBy: query.sort ? ORDER_BY[query.sort] : { itemNo: 'asc' },
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
      include: { department: true, position: true, division: true, employee: true },
    });
  }

  update(id: string, dto: UpdatePlantillaDto) {
    return this.prisma.plantilla.update({
      where: { id },
      data: dto,
      include: { department: true, position: true, division: true, employee: true },
    });
  }

  remove(id: string) {
    return this.prisma.plantilla.delete({ where: { id } });
  }
}
