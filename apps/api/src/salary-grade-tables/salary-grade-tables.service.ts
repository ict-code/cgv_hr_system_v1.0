import { Injectable } from '@nestjs/common';
import type { SalaryGradeTable } from '@egaps/db';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateSalaryGradeTableDto } from './dto/create-salary-grade-table.dto.js';
import type { UpdateSalaryGradeTableDto } from './dto/update-salary-grade-table.dto.js';
import type { ListQueryDto, PaginatedResult } from '../common/dto/list-query.dto.js';

@Injectable()
export class SalaryGradeTablesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListQueryDto): Promise<PaginatedResult<SalaryGradeTable>> {
    const where = query.search
      ? { name: { contains: query.search, mode: 'insensitive' as const } }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.salaryGradeTable.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.salaryGradeTable.count({ where }),
    ]);

    return { data, total, page: query.page, pageSize: query.pageSize };
  }

  // A brand-new table starts empty — grades only appear once someone adds
  // one via "New Grade", rather than pre-filling 50 zero-value rows nobody
  // asked for.
  create(dto: CreateSalaryGradeTableDto) {
    return this.prisma.salaryGradeTable.create({
      data: {
        name: dto.name,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
        description: dto.description,
      },
    });
  }

  update(id: string, dto: UpdateSalaryGradeTableDto) {
    return this.prisma.salaryGradeTable.update({
      where: { id },
      data: {
        name: dto.name,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
        description: dto.description,
      },
    });
  }

  remove(id: string) {
    return this.prisma.salaryGradeTable.delete({ where: { id } });
  }
}
