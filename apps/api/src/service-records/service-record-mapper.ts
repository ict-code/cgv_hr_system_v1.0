import type { CreateServiceRecordDto } from '../appointments/dto/create-service-record.dto.js';

// Shared between the per-employee create/import (appointments module, which
// already owns the GET for service records) and the all-employees bulk
// import (this module) so the field mapping can't drift between the two.
export function toServiceRecordCreateData(employeeId: string, dto: CreateServiceRecordDto) {
  return {
    employeeId,
    startDate: dto.startDate,
    endDate: dto.endDate,
    positionSnapshot: dto.positionSnapshot,
    departmentSnapshot: dto.departmentSnapshot,
    divisionSnapshot: dto.divisionSnapshot,
    empStatusSnapshot: dto.empStatusSnapshot,
    salarySnapshot: dto.salarySnapshot,
    salaryUnitSnapshot: dto.salarySnapshot != null ? 'Monthly' : undefined,
    actlSalarySnapshot: dto.actlSalarySnapshot,
    grade: dto.grade,
    step: dto.step,
    itemNo: dto.itemNo,
    exitDate: dto.exitDate,
    exitCause: dto.exitCause,
    leaveAbsence: dto.leaveAbsence,
    remarks: dto.remarks,
  };
}
