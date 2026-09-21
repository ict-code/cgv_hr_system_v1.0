import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, Plantilla } from '@egaps/db';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreatePlantillaDto } from './dto/create-plantilla.dto.js';
import type { UpdatePlantillaDto } from './dto/update-plantilla.dto.js';
import type { ListPlantillaDto } from './dto/list-plantilla.dto.js';
import type { PaginatedResult } from '../common/dto/list-query.dto.js';
import type { AuthenticatedUser } from '../auth/auth.service.js';
import type { AppointEmployeeDto } from './dto/appoint-employee.dto.js';

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
      ...(query.vacant ? { employeeId: null } : {}),
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

  /**
   * Places an existing employee into a vacant plantilla item in one
   * transaction: Appointment (updated in place if they already have one, like
   * recordChange, else created) + change-log + ServiceRecord chain + the
   * item's incumbent link. The employee must already exist (Personnel File).
   */
  async appointEmployee(plantillaId: string, dto: AppointEmployeeDto, user: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.plantilla.findUnique({
        where: { id: plantillaId },
        include: { department: true, position: true },
      });
      if (!item) throw new NotFoundException(`Plantilla item ${plantillaId} not found`);
      if (item.employeeId) throw new ConflictException('This plantilla item is no longer vacant');

      const employee = await tx.employee.findUnique({ where: { id: dto.employeeId } });
      if (!employee) throw new NotFoundException(`Employee ${dto.employeeId} not found`);

      const held = await tx.plantilla.findFirst({ where: { employeeId: employee.id } });
      if (held) throw new ConflictException(`This employee already holds plantilla item ${held.itemNo}`);

      const statusCode = await tx.appointmentStatusCode.findUnique({ where: { code: dto.status } });
      if (!statusCode || statusCode.mode !== 'ENTRY') {
        throw new BadRequestException('Appointment status must be an Entry-mode status');
      }

      const current = await tx.appointment.findFirst({
        where: { employeeId: employee.id },
        orderBy: { effectDate: 'desc' },
      });

      const actualSalary = dto.actualSalary ?? item.actualSalary ?? undefined;
      const data = {
        employeeId: employee.id,
        departmentId: item.departmentId,
        positionId: item.positionId,
        itemNo: item.itemNo,
        status: dto.status,
        employmentStatus: dto.employmentStatus ?? current?.employmentStatus ?? null,
        appointType: 'REGULAR' as const,
        payMode: dto.payMode ?? current?.payMode ?? null,
        workLevel: dto.workLevel ?? current?.workLevel ?? null,
        authSalary: item.authSalary,
        actualSalary: actualSalary ?? null,
        monthlyRate: dto.monthlyRate ?? null,
        grade: item.grade,
        stepNo: item.step,
        effectDate: dto.effectDate,
        sMode: 1,
      };
      const appointment = current
        ? await tx.appointment.update({ where: { id: current.id }, data })
        : await tx.appointment.create({ data });

      const [oldDept, oldPos] = await Promise.all([
        current?.departmentId ? tx.department.findUnique({ where: { id: current.departmentId } }) : null,
        current?.positionId ? tx.position.findUnique({ where: { id: current.positionId } }) : null,
      ]);
      await tx.appointmentChangeLog.create({
        data: {
          employeeId: employee.id,
          year: dto.effectDate.getFullYear(),
          effectDate: dto.effectDate,
          oldDeptCode: oldDept?.deptCode ?? null,
          oldPositionCode: oldPos?.positionCode ?? null,
          oldActlSalary: current?.actualSalary ?? null,
          oldMonthlyRate: current?.monthlyRate ?? null,
          oldItemNo: current?.itemNo ?? null,
          oldStatusCode: current?.status ?? null,
          oldEmpStatus: current?.employmentStatus ?? null,
          oldGrade: current?.grade ?? null,
          oldStep: current?.stepNo ?? null,
          deptCode: item.department.deptCode,
          positionCode: item.position?.positionCode ?? null,
          actlSalary: actualSalary ?? null,
          monthlyRate: dto.monthlyRate ?? null,
          itemNo: item.itemNo,
          statusCode: dto.status,
          empStatus: data.employmentStatus,
          grade: item.grade,
          step: item.step,
          changedByUserId: user.id,
        },
      });

      const openRecord = await tx.serviceRecord.findFirst({
        where: { employeeId: employee.id, endDate: null },
        orderBy: { startDate: 'desc' },
      });
      if (openRecord) {
        await tx.serviceRecord.update({ where: { id: openRecord.id }, data: { endDate: dto.effectDate } });
      }
      await tx.serviceRecord.create({
        data: {
          employeeId: employee.id,
          startDate: dto.effectDate,
          positionSnapshot: item.position?.positionDesc ?? null,
          departmentSnapshot: item.department.deptDesc,
          empStatusSnapshot: data.employmentStatus,
          salarySnapshot: actualSalary ?? null,
          grade: item.grade,
          step: item.step,
          itemNo: item.itemNo,
        },
      });

      await tx.employee.update({
        where: { id: employee.id },
        data: {
          departmentId: item.departmentId,
          divisionId: item.divisionId,
          appointDate: dto.effectDate,
          ...(employee.dateHired ? {} : { dateHired: dto.effectDate }),
        },
      });

      // Claim the item last, guarded on it still being vacant — a concurrent
      // appointment to the same item makes this 0 rows and rolls everything back.
      const claimed = await tx.plantilla.updateMany({
        where: { id: plantillaId, employeeId: null },
        data: { employeeId: employee.id },
      });
      if (claimed.count !== 1) throw new ConflictException('This plantilla item is no longer vacant');

      return { employeeId: employee.id, appointment, plantillaId };
    });
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
