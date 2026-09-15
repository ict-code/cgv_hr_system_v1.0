import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../auth/auth.service.js';
import type { RecordAppointmentChangeDto } from './dto/record-appointment-change.dto.js';
import type { CreateServiceRecordDto } from './dto/create-service-record.dto.js';
import { toServiceRecordCreateData } from '../service-records/service-record-mapper.js';

// Legacy sMode: 1=active, 2=inactive, CONFIRMED derived from which
// AppointmentStatus is set (PERSONNEL_ANALYSIS.md §5). These four statuses
// represent an employee leaving this department/the service. Kept as a
// fixed, legacy-verified set — separate from AppointmentStatusCode.mode
// (Master Data > Appointment Status File), which is HR-editable and drives
// the Employee.inactive auto-sync below instead.
const INACTIVE_STATUSES = new Set(['DT', 'RS', 'RT', 'TO']);

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async removeCurrent(employeeId: string) {
    const current = await this.prisma.appointment.findFirst({
      where: { employeeId },
      orderBy: { effectDate: 'desc' },
    });
    if (!current) {
      throw new NotFoundException(`Employee ${employeeId} has no appointment on record`);
    }
    return this.prisma.appointment.delete({ where: { id: current.id } });
  }

  findAppointments(employeeId: string) {
    return this.prisma.appointment.findMany({
      where: { employeeId },
      orderBy: { effectDate: 'desc' },
      include: { department: true, position: true },
    });
  }

  findChangeLogs(employeeId: string) {
    return this.prisma.appointmentChangeLog.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
      include: { changedByUser: { select: { id: true, loginId: true, fullName: true } } },
    });
  }

  findServiceRecords(employeeId: string) {
    return this.prisma.serviceRecord.findMany({
      where: { employeeId },
      orderBy: { startDate: 'desc' },
    });
  }

  async createServiceRecord(employeeId: string, dto: CreateServiceRecordDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }
    return this.prisma.serviceRecord.create({ data: toServiceRecordCreateData(employeeId, dto) });
  }

  async importServiceRecords(employeeId: string, records: CreateServiceRecordDto[]) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }
    const result = await this.prisma.serviceRecord.createMany({
      data: records.map((dto) => toServiceRecordCreateData(employeeId, dto)),
    });
    return { imported: result.count };
  }

  async recordChange(
    employeeId: string,
    dto: RecordAppointmentChangeDto,
    currentUser: AuthenticatedUser,
  ) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.appointment.findFirst({
        where: { employeeId },
        orderBy: { effectDate: 'desc' },
      });

      const [oldDept, oldPos, newDept, newPos] = await Promise.all([
        current?.departmentId
          ? tx.department.findUnique({ where: { id: current.departmentId } })
          : Promise.resolve(null),
        current?.positionId
          ? tx.position.findUnique({ where: { id: current.positionId } })
          : Promise.resolve(null),
        dto.departmentId
          ? tx.department.findUnique({ where: { id: dto.departmentId } })
          : Promise.resolve(null),
        dto.positionId
          ? tx.position.findUnique({ where: { id: dto.positionId } })
          : Promise.resolve(null),
      ]);

      const nextAppointmentData = {
        employeeId,
        departmentId: dto.departmentId ?? current?.departmentId ?? null,
        positionId: dto.positionId ?? current?.positionId ?? null,
        itemNo: dto.itemNo ?? current?.itemNo ?? null,
        status: dto.status,
        employmentStatus: dto.employmentStatus ?? current?.employmentStatus ?? null,
        appointType: dto.appointType ?? current?.appointType ?? null,
        payMode: dto.payMode ?? current?.payMode ?? null,
        workLevel: dto.workLevel ?? current?.workLevel ?? null,
        actualSalary: dto.actualSalary ?? current?.actualSalary ?? null,
        monthlyRate: dto.monthlyRate ?? current?.monthlyRate ?? null,
        grade: dto.grade ?? current?.grade ?? null,
        stepNo: dto.stepNo ?? current?.stepNo ?? null,
        startDate: dto.startDate ?? current?.startDate ?? null,
        endDate: dto.endDate ?? current?.endDate ?? null,
        effectDate: dto.effectDate,
        sMode: INACTIVE_STATUSES.has(dto.status) ? 2 : 1,
      };

      // Appointment is overwritten in place — it holds current/live state only
      // (PERSONNEL_ANALYSIS.md §2, CHGAPP.P lines 79-164).
      const appointment = current
        ? await tx.appointment.update({ where: { id: current.id }, data: nextAppointmentData })
        : await tx.appointment.create({ data: nextAppointmentData });

      // App-Change equivalent: append-only, full before/after snapshot.
      const changeLog = await tx.appointmentChangeLog.create({
        data: {
          employeeId,
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
          deptCode: newDept?.deptCode ?? oldDept?.deptCode ?? null,
          positionCode: newPos?.positionCode ?? oldPos?.positionCode ?? null,
          actlSalary: nextAppointmentData.actualSalary,
          monthlyRate: nextAppointmentData.monthlyRate,
          itemNo: nextAppointmentData.itemNo,
          statusCode: dto.status,
          empStatus: nextAppointmentData.employmentStatus,
          grade: nextAppointmentData.grade,
          step: nextAppointmentData.stepNo,
          efficiencyRate: dto.efficiencyRate ?? null,
          changedByUserId: currentUser.id,
        },
      });

      // ServiceRecord is chained: close the currently-open period, open a new one.
      const openRecord = await tx.serviceRecord.findFirst({
        where: { employeeId, endDate: null },
        orderBy: { startDate: 'desc' },
      });

      if (openRecord) {
        await tx.serviceRecord.update({
          where: { id: openRecord.id },
          data: { endDate: dto.effectDate },
        });
      }

      const serviceRecord = await tx.serviceRecord.create({
        data: {
          employeeId,
          startDate: dto.effectDate,
          positionSnapshot: newPos?.positionDesc ?? oldPos?.positionDesc ?? null,
          departmentSnapshot: newDept?.deptDesc ?? oldDept?.deptDesc ?? null,
          empStatusSnapshot: nextAppointmentData.employmentStatus,
          salarySnapshot: nextAppointmentData.actualSalary,
          grade: nextAppointmentData.grade,
          step: nextAppointmentData.stepNo,
          itemNo: nextAppointmentData.itemNo,
        },
      });

      const statusCode = await tx.appointmentStatusCode.findUnique({ where: { code: dto.status } });
      if (statusCode?.mode === 'EXIT') {
        await tx.employee.update({
          where: { id: employeeId },
          data: { inactive: true, dateInactivated: dto.effectDate, inactiveCause: statusCode.description },
        });
      }

      return { appointment, changeLog, serviceRecord };
    });
  }
}
