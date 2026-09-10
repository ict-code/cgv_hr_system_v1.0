import { Injectable } from '@nestjs/common';
import type { SalaryGrade } from '@egaps/db';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateSalaryGradeDto } from './dto/create-salary-grade.dto.js';
import type { UpdateSalaryStepDto } from './dto/update-salary-step.dto.js';
import type { ListQueryDto, PaginatedResult } from '../common/dto/list-query.dto.js';

@Injectable()
export class SalaryGradesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListQueryDto): Promise<PaginatedResult<SalaryGrade>> {
    const [data, total] = await Promise.all([
      this.prisma.salaryGrade.findMany({
        include: { steps: { orderBy: { stepNo: 'asc' } } },
        orderBy: { gradeNo: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.salaryGrade.count(),
    ]);

    return { data, total, page: query.page, pageSize: query.pageSize };
  }

  create(dto: CreateSalaryGradeDto) {
    return this.prisma.$transaction(async (tx) => {
      const grade = await tx.salaryGrade.create({ data: { gradeNo: dto.gradeNo } });

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
}
