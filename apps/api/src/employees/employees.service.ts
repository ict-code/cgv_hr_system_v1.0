import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@egaps/db';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateEmployeeDto } from './dto/create-employee.dto.js';
import type { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import type { ListEmployeesDto } from './dto/list-employees.dto.js';
import type { PaginatedResult } from '../common/dto/list-query.dto.js';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListEmployeesDto): Promise<PaginatedResult<unknown>> {
    // Real employees can carry more than one Appointment row (the original
    // bulk import loaded full history, not just the current state — the
    // in-place-update behavior only applies to changes made through this
    // app going forward). So `appointments: { some: {...} }` would match on
    // ANY historical status, not necessarily the current one. Instead:
    // find each employee's true latest appointment (by effectDate) first,
    // then check whether THAT ONE has a matching employmentStatus.
    let employmentStatusEmployeeIds: string[] | undefined;
    if (query.employmentStatus?.length) {
      const latest = await this.prisma.$queryRaw<{ employeeId: string }[]>`
        SELECT "employeeId" FROM (
          SELECT DISTINCT ON (a."employeeId") a."employeeId", a."employmentStatus"
          FROM appointments a
          ORDER BY a."employeeId", a."effectDate" DESC NULLS LAST
        ) latest
        WHERE latest."employmentStatus" = ANY(${query.employmentStatus})
      `;
      employmentStatusEmployeeIds = latest.map((r) => r.employeeId);
    }

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
      ...(query.withoutPlantilla ? { plantillaItems: { none: {} } } : {}),
      ...(employmentStatusEmployeeIds ? { id: { in: employmentStatusEmployeeIds } } : {}),
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
        voluntaryWork: { orderBy: { startDate: 'desc' } },
        distinctions: { orderBy: { createdAt: 'asc' } },
        orgMemberships: { orderBy: { createdAt: 'asc' } },
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
    // findOne() pulls 12 relations for the detail page — far more than an
    // existence check needs. Just attempt the update and translate Prisma's
    // "no row" error, instead of paying for that full fetch on every save.
    try {
      return await this.prisma.employee.update({ where: { id }, data: dto });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException(`Employee ${id} not found`);
      }
      throw err;
    }
  }
}
