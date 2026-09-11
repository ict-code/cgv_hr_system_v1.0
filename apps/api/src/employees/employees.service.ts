import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@egaps/db';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateEmployeeDto } from './dto/create-employee.dto.js';
import type { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import type { ListEmployeesDto } from './dto/list-employees.dto.js';
import type { PaginatedResult } from '../common/dto/list-query.dto.js';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListEmployeesDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.EmployeeWhereInput = {
      ...(query.search
        ? {
            OR: [
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { idNo: { contains: query.search, mode: 'insensitive' } },
              { biometricId: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.inactive !== undefined ? { inactive: query.inactive } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        orderBy: { lastName: 'asc' },
        include: {
          department: true,
          appointments: { take: 1, orderBy: { effectDate: 'desc' }, include: { position: true } },
        },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { data, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        division: true,
        salaryGradeTable: true,
        dependents: true,
        appointments: { orderBy: { effectDate: 'desc' } },
        changeLogs: { orderBy: { createdAt: 'desc' } },
        serviceRecords: { orderBy: { startDate: 'desc' } },
        educationRecords: { orderBy: { createdAt: 'desc' } },
        eligibilityRecords: { orderBy: { createdAt: 'desc' } },
        workExperience: { orderBy: { startDate: 'desc' } },
        trainingRecords: { orderBy: { createdAt: 'desc' } },
        skills: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee ${id} not found`);
    }

    return employee;
  }

  create(dto: CreateEmployeeDto) {
    return this.prisma.employee.create({ data: dto });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);
    return this.prisma.employee.update({ where: { id }, data: dto });
  }
}
