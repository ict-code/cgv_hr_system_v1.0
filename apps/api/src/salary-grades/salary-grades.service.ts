import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateSalaryGradeDto } from './dto/create-salary-grade.dto.js';

@Injectable()
export class SalaryGradesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.salaryGrade.findMany({
      include: { steps: { orderBy: { stepNo: 'asc' } } },
      orderBy: { gradeNo: 'asc' },
    });
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
}
