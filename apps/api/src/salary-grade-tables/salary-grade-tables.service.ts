import { Injectable } from '@nestjs/common';
import type { SalaryGradeTable } from '@egaps/db';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateSalaryGradeTableDto } from './dto/create-salary-grade-table.dto.js';
import type { UpdateSalaryGradeTableDto } from './dto/update-salary-grade-table.dto.js';
import type { ListQueryDto, PaginatedResult } from '../common/dto/list-query.dto.js';

const GRADE_COUNT = 50;
const STEP_COUNT = 10;

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

  // A brand-new table starts pre-populated with the standard 1-50 grade x
  // 1-10 step grid (all amounts 0) so it's immediately usable in the same
  // editable grid as an imported table, instead of requiring 50 separate
  // "add a grade" round-trips before anyone can enter figures.
  create(dto: CreateSalaryGradeTableDto) {
    return this.prisma.$transaction(async (tx) => {
      const table = await tx.salaryGradeTable.create({
        data: {
          name: dto.name,
          effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
          description: dto.description,
        },
      });

      const grades = await tx.salaryGrade.createManyAndReturn({
        data: Array.from({ length: GRADE_COUNT }, (_, i) => ({
          gradeNo: i + 1,
          salaryGradeTableId: table.id,
        })),
      });

      await tx.salaryStep.createMany({
        data: grades.flatMap((grade) =>
          Array.from({ length: STEP_COUNT }, (_, i) => ({
            salaryGradeId: grade.id,
            stepNo: i + 1,
            amount: 0,
            monthlyRate: 0,
          })),
        ),
      });

      return table;
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
