import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { toServiceRecordCreateData } from './service-record-mapper.js';
import type { ServiceRecordImportRowDto } from './dto/import-all-service-records.dto.js';

@Injectable()
export class ServiceRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async importAll(rows: ServiceRecordImportRowDto[]) {
    const empNos = Array.from(new Set(rows.map((r) => r.empNo)));
    const employees = await this.prisma.employee.findMany({
      where: { empNo: { in: empNos } },
      select: { id: true, empNo: true },
    });
    const employeeIdByEmpNo = new Map(employees.map((e) => [e.empNo, e.id]));

    const data: ReturnType<typeof toServiceRecordCreateData>[] = [];
    const unmatchedEmpNos = new Set<number>();
    for (const row of rows) {
      const employeeId = employeeIdByEmpNo.get(row.empNo);
      if (!employeeId) {
        unmatchedEmpNos.add(row.empNo);
        continue;
      }
      data.push(toServiceRecordCreateData(employeeId, row));
    }

    const result = data.length > 0 ? await this.prisma.serviceRecord.createMany({ data }) : { count: 0 };
    return { imported: result.count, unmatchedEmpNos: Array.from(unmatchedEmpNos).sort((a, b) => a - b) };
  }
}
