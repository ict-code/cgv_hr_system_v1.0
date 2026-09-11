import { Injectable, NotFoundException } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ExportServiceRecordDto } from './dto/export-service-record.dto.js';

// dist/main.js lives at /repo/dist — the template ships as a sibling of
// dist, see apps/api/Dockerfile's runtime stage (COPY ... /repo/templates).
const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = join(__dirname, '../../templates/service_record_template.docx');

function formatDate(value: Date | null | undefined): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

function formatAmount(value: unknown): string {
  if (value === null || value === undefined) return '';
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

@Injectable()
export class ServiceRecordExportService {
  constructor(private readonly prisma: PrismaService) {}

  async export(employeeId: string, dto: ExportServiceRecordDto): Promise<Buffer> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { serviceRecords: { orderBy: { startDate: 'asc' } } },
    });
    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }

    const employmentStatuses = await this.prisma.employmentStatusCode.findMany();
    const statusLabel = (code: string | null) =>
      code ? (employmentStatuses.find((s) => s.code === code)?.description ?? code) : '';

    const content = readFileSync(TEMPLATE_PATH, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    doc.render({
      lastName: employee.lastName,
      firstName: employee.firstName,
      middleName: employee.middleName ?? '',
      birthDate: formatDate(employee.birthDate),
      serviceRecords: employee.serviceRecords.map((r) => ({
        fromDate: formatDate(r.startDate),
        toDate: r.endDate ? formatDate(r.endDate) : '',
        designation: r.positionSnapshot ?? '',
        status: statusLabel(r.empStatusSnapshot),
        salary: formatAmount(r.actlSalarySnapshot ?? r.salarySnapshot),
        office: r.departmentSnapshot ?? '',
        separation: r.endDate ? '' : 'None',
      })),
      certifiedDate: dto.certifiedDate ?? '',
      signatoryName: dto.signatoryName ?? '',
      signatoryPosition: dto.signatoryPosition ?? '',
    });

    return doc.getZip().generate({ type: 'nodebuffer' });
  }
}
