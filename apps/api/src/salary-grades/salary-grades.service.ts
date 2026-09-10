import { Injectable } from '@nestjs/common';
import type { Prisma, SalaryGrade } from '@egaps/db';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateSalaryGradeDto } from './dto/create-salary-grade.dto.js';
import type { UpdateSalaryStepDto } from './dto/update-salary-step.dto.js';
import type { ListSalaryGradesDto } from './dto/list-salary-grades.dto.js';
import type { PaginatedResult } from '../common/dto/list-query.dto.js';

@Injectable()
export class SalaryGradesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListSalaryGradesDto): Promise<PaginatedResult<SalaryGrade>> {
    const where: Prisma.SalaryGradeWhereInput = query.salaryGradeTableId
      ? { salaryGradeTableId: query.salaryGradeTableId }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.salaryGrade.findMany({
        where,
        include: { steps: { orderBy: { stepNo: 'asc' } } },
        orderBy: { gradeNo: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.salaryGrade.count({ where }),
    ]);

    return { data, total, page: query.page, pageSize: query.pageSize };
  }

  create(dto: CreateSalaryGradeDto) {
    return this.prisma.$transaction(async (tx) => {
      const grade = await tx.salaryGrade.create({
        data: { gradeNo: dto.gradeNo, salaryGradeTableId: dto.salaryGradeTableId },
      });

      await tx.salaryStep.createMany({
        data: dto.steps.map((step, index) => ({
          salaryGradeId: grade.id,
          stepNo: index + 1,
          amount: step.amount,
          monthlyRate: step.monthlyRate,
        })),
      });

      return tx.salaryGrade.findUniqueOrThrow({
        where: { id: grade.id },
        include: { steps: { orderBy: { stepNo: 'asc' } } },
      });
    });
  }

  updateStep(gradeId: string, stepNo: number, dto: UpdateSalaryStepDto) {
    return this.prisma.salaryStep.update({
      where: { salaryGradeId_stepNo: { salaryGradeId: gradeId, stepNo } },
      data: { amount: dto.amount },
    });
  }

  // Steps cascade-delete at the DB level (SalaryStep.salaryGrade is onDelete: Cascade).
  remove(id: string) {
    return this.prisma.salaryGrade.delete({ where: { id } });
  }
}
