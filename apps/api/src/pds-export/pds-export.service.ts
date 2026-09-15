import { Injectable, NotFoundException } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = join(__dirname, '../../templates/pds-template.xlsx');

// ---------------------------------------------------------------------------
// CS Form No. 212 (Revised 2026) writes to fixed cell addresses — mapped by
// hand from the real template's merged-cell layout (see PDS Field Mapping
// doc). Checkbox-driven fields (Sex at Birth, Civil Status, Citizenship,
// the Section IV Y/N disclosure questions, PWD/Indigenous/Solo Parent) are
// deliberately NOT filled here — they're real Excel form controls linked to
// boolean cells, and mis-ticking a sworn legal disclosure on an official CSC
// form is a worse outcome than leaving it blank for the employee to tick by
// hand. Everything else — the vast majority of the form's real data — is
// filled automatically.
// ---------------------------------------------------------------------------

function formatPdsDate(value: Date | string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function set(sheet: ExcelJS.Worksheet, row: number, col: number, value: unknown) {
  if (value === null || value === undefined || value === '') return;
  sheet.getCell(row, col).value = value as ExcelJS.CellValue;
}

type ColumnMap = Record<string, number>;

// Fills a repeating table's primary-sheet rows first, then spills any extra
// rows onto the matching continuation sheet — mirrors how the printed CS
// Form 212 itself is designed to overflow (its own "(Continue on sheet Cn
// if necessary)" notes), just done for the employee automatically.
function writeRepeating(
  primarySheet: ExcelJS.Worksheet,
  primaryRange: [number, number],
  continuationSheet: ExcelJS.Worksheet | null,
  continuationRange: [number, number] | null,
  columns: ColumnMap,
  rows: Record<string, unknown>[],
) {
  const primaryCount = primaryRange[1] - primaryRange[0] + 1;
  const primaryRows = rows.slice(0, primaryCount);
  const overflowRows = rows.slice(primaryCount);

  primaryRows.forEach((data, i) => {
    const rowNum = primaryRange[0] + i;
    for (const [field, col] of Object.entries(columns)) {
      set(primarySheet, rowNum, col, data[field]);
    }
  });

  if (!continuationSheet || !continuationRange || overflowRows.length === 0) return;
  const contCount = continuationRange[1] - continuationRange[0] + 1;
  overflowRows.slice(0, contCount).forEach((data, i) => {
    const rowNum = continuationRange[0] + i;
    for (const [field, col] of Object.entries(columns)) {
      set(continuationSheet, rowNum, col, data[field]);
    }
  });
}

const EDUCATION_LEVEL_ROWS: Record<string, number> = {
  ELEMENTARY: 55,
  SECONDARY: 56,
  'VOCATIONAL/TRADE COURSE': 57,
  COLLEGE: 58,
  'GRADUATE STUDIES': 59,
};

// Real data stores level as the legacy Educ-Level numeric code (1-10, all ten
// in use), not text — confirmed against production (2026-09-15): odd/even
// pairs share a category (e.g. a real employee's 1/3/5/7/9 lined up exactly
// with Elementary/Secondary/Vocational/College/Graduate Studies in that
// order). Text is also accepted in case a record was hand-entered via the
// Education tab's free-text Level field instead of imported from legacy.
const EDUCATION_LEVEL_CODES: Record<string, string> = {
  '1': 'ELEMENTARY',
  '2': 'ELEMENTARY',
  '3': 'SECONDARY',
  '4': 'SECONDARY',
  '5': 'VOCATIONAL/TRADE COURSE',
  '6': 'VOCATIONAL/TRADE COURSE',
  '7': 'COLLEGE',
  '8': 'COLLEGE',
  '9': 'GRADUATE STUDIES',
  '10': 'GRADUATE STUDIES',
};

function normalizeEducationLevel(level: string): string {
  const trimmed = level.trim();
  if (EDUCATION_LEVEL_CODES[trimmed]) return EDUCATION_LEVEL_CODES[trimmed];
  const up = trimmed.toUpperCase();
  if (up.includes('ELEM')) return 'ELEMENTARY';
  if (up.includes('SECOND') || up.includes('HIGH SCHOOL')) return 'SECONDARY';
  if (up.includes('VOC') || up.includes('TRADE')) return 'VOCATIONAL/TRADE COURSE';
  if (up.includes('GRAD')) return 'GRADUATE STUDIES';
  if (up.includes('COLLEGE') || up.includes('BACHELOR') || up.includes('UNIVERSITY')) return 'COLLEGE';
  return up;
}

@Injectable()
export class PdsExportService {
  constructor(private readonly prisma: PrismaService) {}

  async export(employeeId: string): Promise<Buffer> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        dependents: { orderBy: { createdAt: 'asc' } },
        educationRecords: { orderBy: { createdAt: 'asc' } },
        eligibilityRecords: { orderBy: { createdAt: 'asc' } },
        workExperience: { orderBy: { startDate: 'desc' } },
        trainingRecords: { orderBy: { startDate: 'desc' } },
        skills: { orderBy: { createdAt: 'asc' } },
        voluntaryWork: { orderBy: { startDate: 'desc' } },
        distinctions: { orderBy: { createdAt: 'asc' } },
        orgMemberships: { orderBy: { createdAt: 'asc' } },
        serviceRecords: { orderBy: { startDate: 'desc' } },
      },
    });
    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }

    const employmentStatuses = await this.prisma.employmentStatusCode.findMany();
    const statusLabel = (code: string | null) =>
      code ? (employmentStatuses.find((s) => s.code === code)?.description ?? code) : '';

    const content = readFileSync(TEMPLATE_PATH);
    const arrayBuffer = content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength) as ArrayBuffer;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const c1 = workbook.getWorksheet('C1')!;
    const c2 = workbook.getWorksheet('C2')!;
    const c3 = workbook.getWorksheet('C3')!;
    const c4 = workbook.getWorksheet('C4')!;
    const c5 = workbook.getWorksheet('C5_L&D cont.') ?? null;
    const c6 = workbook.getWorksheet('C6_Work Exp cont.') ?? null;
    const c8 = workbook.getWorksheet('C8_Educ. Background cont.') ?? null;

    // --- I. Personal Information (C1) ---------------------------------------
    set(c1, 10, 4, employee.lastName);
    set(c1, 11, 4, employee.firstName);
    set(c1, 11, 14, employee.suffix);
    set(c1, 12, 4, employee.middleName);
    set(c1, 13, 4, formatPdsDate(employee.birthDate));
    set(c1, 15, 4, employee.birthPlace);
    set(c1, 22, 4, employee.height);
    set(c1, 24, 4, employee.weight);
    set(c1, 25, 4, employee.bloodType);
    set(c1, 29, 4, employee.pagibigNo);
    set(c1, 31, 4, employee.philhealthNo);
    set(c1, 32, 4, employee.philsysNo);
    set(c1, 33, 4, employee.tin);
    set(c1, 34, 4, String(employee.idNo || employee.biometricId || employee.empNo));

    // Residential address (I17:K17 / L17:N17 value boxes, captioned below).
    // Real data rarely has the structured addr* components filled in (~26%
    // of employees) — most only have the single free-text `address` blob
    // (~79%), so fall back to dropping the whole thing in the Street box
    // rather than leaving the section blank.
    const blockLot = [employee.addrUnitNo, employee.addrBlockNo, employee.addrLot].filter(Boolean).join(' ');
    const hasStructuredAddr = blockLot || employee.addrStreet || employee.addrBarangay || employee.addrLocality;
    set(c1, 17, 9, blockLot || undefined);
    set(c1, 17, 12, employee.addrStreet || (hasStructuredAddr ? undefined : employee.address));
    set(c1, 19, 9, employee.addrPhase);
    set(c1, 19, 12, employee.addrBarangay);
    set(c1, 22, 9, employee.addrLocality);
    set(c1, 22, 12, employee.addrProvince);
    set(c1, 24, 9, employee.addrZip);

    // Permanent address — single free-text block, not structured like above
    set(c1, 25, 9, employee.permanentAddress);
    set(c1, 31, 9, employee.permanentZipCode);

    set(c1, 32, 9, employee.telNo || employee.addrTelNo);
    set(c1, 33, 9, employee.cellNo);
    set(c1, 34, 9, employee.emailAddress);

    // --- II. Family Background (C1) -----------------------------------------
    // Combined single-string names land whole in Surname; First/Middle stay
    // blank rather than risk a wrong split (see PDS Field Mapping doc, decision 1).
    set(c1, 36, 4, employee.spouseName);
    set(c1, 39, 4, employee.spouseWork);
    set(c1, 44, 4, employee.fatherName);
    set(c1, 48, 4, employee.motherName);

    const childRows: [number, number][] = [
      [37, 13],
      [38, 13],
      [39, 13],
      [40, 13],
      [41, 13],
    ];
    employee.dependents.slice(0, childRows.length).forEach((dep, i) => {
      const [row] = childRows[i];
      set(c1, row, 9, dep.name);
      set(c1, row, 13, formatPdsDate(dep.birthDate));
    });

    // --- III. Educational Background (C1 fixed level rows + C8 overflow) ---
    const educationOverflow: Record<string, unknown>[] = [];
    const usedLevelRows = new Set<number>();
    for (const rec of employee.educationRecords) {
      const normalized = normalizeEducationLevel(rec.level);
      const row = EDUCATION_LEVEL_ROWS[normalized];
      if (row && !usedLevelRows.has(row)) {
        usedLevelRows.add(row);
        set(c1, row, 4, rec.schoolName);
        set(c1, row, 7, rec.course ?? rec.degree);
        set(c1, row, 10, rec.attendanceFrom);
        set(c1, row, 11, rec.attendanceTo);
        set(c1, row, 13, rec.yearGraduated);
        set(c1, row, 14, rec.honors);
      } else {
        educationOverflow.push({
          level: rec.level,
          school: rec.schoolName,
          course: rec.course ?? rec.degree,
          from: rec.attendanceFrom,
          to: rec.attendanceTo,
          yearGraduated: rec.yearGraduated,
          honors: rec.honors,
        });
      }
    }
    if (educationOverflow.length > 0 && c8) {
      writeRepeating(
        c8,
        [6, 42],
        null,
        null,
        { level: 1, school: 4, course: 7, from: 10, to: 11, yearGraduated: 13, honors: 14 },
        educationOverflow,
      );
    }

    // --- IV. Civil Service Eligibility (C2) ---------------------------------
    writeRepeating(
      c2,
      [5, 11],
      null,
      null,
      { name: 1, rating: 6, examDate: 7, place: 9, licenseNumber: 12, licenseValidity: 13 },
      employee.eligibilityRecords.map((e) => ({
        name: e.examName,
        rating: e.rating,
        examDate: formatPdsDate(e.examDate),
        place: e.examPlace,
        licenseNumber: e.licenseNumber,
        licenseValidity: formatPdsDate(e.licenseValidity),
      })),
    );

    // --- V. Work Experience (C2 + C6 overflow) ------------------------------
    // This LGU's own history (ServiceRecord, Gov't Service = Y) merged with
    // prior/external jobs (EmployeeWorkExperience, Gov't Service = N),
    // newest first — see PDS Field Mapping doc, decision 2.
    type WorkRow = { sortKey: number; from: string; to: string; position: string; department: string; salary: number | undefined; gradeStep: string; status: string; govtService: string };
    const govtWork: WorkRow[] = employee.serviceRecords.map((sr) => ({
      sortKey: sr.startDate ? new Date(sr.startDate).getTime() : 0,
      from: formatPdsDate(sr.startDate),
      to: sr.endDate ? formatPdsDate(sr.endDate) : '',
      position: sr.positionSnapshot ?? '',
      department: sr.departmentSnapshot ?? '',
      salary: sr.salarySnapshot ? Number(sr.salarySnapshot) : undefined,
      gradeStep: sr.grade ? `${String(sr.grade).padStart(2, '0')}-${sr.step ?? 0}` : '',
      status: statusLabel(sr.empStatusSnapshot),
      govtService: 'Y',
    }));
    const externalWork: WorkRow[] = employee.workExperience.map((we) => ({
      sortKey: we.startDate ? new Date(we.startDate).getTime() : 0,
      from: we.startDate ? formatPdsDate(we.startDate) : '',
      to: we.endDate ? formatPdsDate(we.endDate) : '',
      position: we.position ?? '',
      department: we.company,
      salary: we.salary ? Number(we.salary) : undefined,
      gradeStep: '',
      status: we.employmentStatus ?? '',
      govtService: 'N',
    }));
    const allWork = [...govtWork, ...externalWork].sort((a, b) => b.sortKey - a.sortKey);

    writeRepeating(
      c2,
      [18, 41],
      c6,
      [7, 39],
      { from: 1, to: 3, position: 4, department: 7, salary: 10, gradeStep: 11, status: 12, govtService: 13 },
      allWork,
    );

    // --- VI. Learning & Development / Trainings (C3 + C5 overflow) --------
    writeRepeating(
      c3,
      [5, 11],
      c5,
      [6, 49],
      { title: 1, from: 5, to: 6, hours: 7, type: 8, conductor: 9 },
      employee.trainingRecords.map((t) => ({
        title: t.trainingName,
        from: formatPdsDate(t.startDate),
        to: formatPdsDate(t.endDate),
        hours: t.numberOfHours,
        type: t.type ? t.type.charAt(0) + t.type.slice(1).toLowerCase() : '',
        conductor: t.conductor,
      })),
    );

    // --- VII. Voluntary Work (C3) --------------------------------------------
    writeRepeating(
      c3,
      [27, 35],
      null,
      null,
      { organization: 1, from: 5, to: 6, hours: 7, position: 8 },
      employee.voluntaryWork.map((v) => ({
        organization: v.address ? `${v.organization} — ${v.address}` : v.organization,
        from: formatPdsDate(v.startDate),
        to: formatPdsDate(v.endDate),
        hours: v.numberOfHours,
        position: v.position,
      })),
    );

    // --- VIII. Other Information (C3) ---------------------------------------
    const otherInfoRows = Math.max(employee.skills.length, employee.distinctions.length, employee.orgMemberships.length);
    for (let i = 0; i < Math.min(otherInfoRows, 7); i++) {
      const row = 39 + i;
      set(c3, row, 1, employee.skills[i]?.name);
      set(c3, row, 3, employee.distinctions[i]?.name);
      set(c3, row, 9, employee.orgMemberships[i]?.name);
    }

    // --- Date Accomplished (C4) ---------------------------------------------
    set(c4, 64, 7, formatPdsDate(new Date()));

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
