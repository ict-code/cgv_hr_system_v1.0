// Imports real Personnel data exported by legacy_db/extract_personnel_data.p
// into Postgres via Prisma. Reads tab-delimited files from a directory (the
// export/ dir, mounted read-only — never copied into a Docker image, never
// committed to git: this is real government HR data).
//
// Usage:
//   node scripts/import-legacy-data.mjs --dir /path/to/export [--dry-run]
//
// Idempotent: Department/Position/Employee use real upserts (unique natural
// keys already in the schema). Child records (Appointment, Education, etc.)
// have no DB-level unique constraint — a re-run checks an in-memory set of
// existing natural keys built from one findMany per table, not the schema,
// so nothing is duplicated on a second run and no constraint was added to
// tables the live app already writes to.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '../generated/client/index.js';

const args = process.argv.slice(2);
const dirIndex = args.indexOf('--dir');
const exportDir = dirIndex >= 0 ? args[dirIndex + 1] : null;
const dryRun = args.includes('--dry-run');

if (!exportDir) {
  console.error('Usage: node import-legacy-data.mjs --dir <export-dir> [--dry-run]');
  process.exit(1);
}

const prisma = new PrismaClient();

const summary = {};
function record(table, kind) {
  summary[table] ??= { imported: 0, skipped: 0, errored: 0 };
  summary[table][kind]++;
}

function readTsv(filename) {
  const path = join(exportDir, filename);
  const text = readFileSync(path, 'utf-8').replace(/\r\n/g, '\n');
  const lines = text.split('\n').filter((l) => l.length > 0);
  const header = lines[0].split('\t');
  return lines.slice(1).map((line) => {
    const cells = line.split('\t');
    const row = {};
    header.forEach((col, i) => (row[col] = cells[i] ?? ''));
    return row;
  });
}

function s(v) {
  return v === '' ? undefined : v;
}
function n(v) {
  return v === '' || v === undefined ? undefined : Number(v);
}
function i(v) {
  return v === '' || v === undefined ? undefined : parseInt(v, 10);
}
function d(v) {
  return v === '' || v === undefined ? undefined : new Date(v + 'T00:00:00.000Z');
}
function b(v) {
  return v === 'Y';
}

const PAY_MODES = { 1: 'DAILY', 2: 'WEEKLY', 3: 'SEMI_MONTHLY', 4: 'MONTHLY' };
const WORK_LEVELS = { 1: 'FIRST_LEVEL', 2: 'SECOND_LEVEL', 3: 'THIRD_LEVEL' };
// CONFIRMED against real data (2026-09-10) — see schema.prisma's AppointType
// doc comment. Real Appointment.appoint-type only ever takes 1/2/3.
const APPOINT_TYPES = { 1: 'REGULAR', 2: 'CASUAL', 3: 'CONTRACT_OF_SERVICE' };
// Appointment.Emp-Status is a raw EmployType.emp-status code, not the 1-6
// numeric scheme PERSONNEL_ANALYSIS.md described (that was a guess made
// before real DB access) — stored as-is now (see Employment Status File /
// EmploymentStatusCode master data). Real values found: CL, CS, CT, EL, P.

async function main() {
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Importing legacy Personnel data from ${exportDir}`);

  // --- Departments ---------------------------------------------------------
  const deptRows = readTsv('departments.txt');
  const deptIdByCode = new Map();
  for (const row of deptRows) {
    const deptCode = i(row.deptCode);
    if (deptCode === undefined) continue;
    try {
      if (!dryRun) {
        const dept = await prisma.department.upsert({
          where: { deptCode },
          update: {
            deptDesc: row.deptDesc || 'Unnamed',
            shortDesc: s(row.shortDesc),
            deptHead: s(row.deptHead),
            certifyName: s(row.certifyName),
            certifyPosition: s(row.certifyPosition),
            approveName: s(row.approveName),
            approvePosition: s(row.approvePosition),
            fundCode: i(row.fundCode),
            subCode: s(row.subCode),
            refCode: s(row.refCode),
          },
          create: {
            deptCode,
            deptDesc: row.deptDesc || 'Unnamed',
            shortDesc: s(row.shortDesc),
            deptHead: s(row.deptHead),
            certifyName: s(row.certifyName),
            certifyPosition: s(row.certifyPosition),
            approveName: s(row.approveName),
            approvePosition: s(row.approvePosition),
            fundCode: i(row.fundCode),
            subCode: s(row.subCode),
            refCode: s(row.refCode),
          },
        });
        deptIdByCode.set(deptCode, dept.id);
      }
      record('departments', 'imported');
    } catch (err) {
      record('departments', 'errored');
      console.error(`  department ${deptCode} error:`, err.message);
    }
  }
  if (dryRun) {
    for (const row of deptRows) deptIdByCode.set(i(row.deptCode), `dry-${row.deptCode}`);
  }

  // --- Positions -------------------------------------------------------------
  const posRows = readTsv('positions.txt');
  const posIdByCode = new Map();
  for (const row of posRows) {
    const positionCode = i(row.positionCode);
    if (positionCode === undefined) continue;
    try {
      if (!dryRun) {
        const pos = await prisma.position.upsert({
          where: { positionCode },
          update: {
            positionDesc: row.positionDesc || 'Unnamed',
            shortDesc: s(row.shortDesc),
            positionGroup: i(row.positionGroup),
          },
          create: {
            positionCode,
            positionDesc: row.positionDesc || 'Unnamed',
            shortDesc: s(row.shortDesc),
            positionGroup: i(row.positionGroup),
          },
        });
        posIdByCode.set(positionCode, pos.id);
      }
      record('positions', 'imported');
    } catch (err) {
      record('positions', 'errored');
      console.error(`  position ${positionCode} error:`, err.message);
    }
  }
  if (dryRun) {
    for (const row of posRows) posIdByCode.set(i(row.positionCode), `dry-${row.positionCode}`);
  }

  // --- Appointment status codes ------------------------------------------------
  const statusRows = readTsv('appointment_status_codes.txt');
  const knownCodes = new Set(statusRows.map((r) => r.code));
  if (!dryRun) {
    for (const row of statusRows) {
      try {
        await prisma.appointmentStatusCode.upsert({
          where: { code: row.code },
          update: { description: row.description },
          create: { code: row.code, description: row.description },
        });
        record('appointmentStatusCodes', 'imported');
      } catch (err) {
        record('appointmentStatusCodes', 'errored');
        console.error(`  appointment status ${row.code} error:`, err.message);
      }
    }
  }

  // --- Employees ---------------------------------------------------------------
  const empRows = readTsv('employees.txt');
  const empIdByNo = new Map();
  for (const row of empRows) {
    const empNo = i(row.empNo);
    if (empNo === undefined) continue;
    const data = {
      lastName: row.lastName || 'Unknown',
      firstName: row.firstName || 'Unknown',
      middleName: s(row.middleName),
      suffix: s(row.suffix),
      birthDate: d(row.birthDate),
      birthPlace: s(row.birthPlace),
      sex: s(row.sex),
      civilStatus: s(row.civilStatus),
      nationality: row.nationality || 'Filipino',
      fatherName: s(row.fatherName),
      fatherBirthPlace: s(row.fatherBirthPlace),
      motherName: s(row.motherName),
      motherBirthPlace: s(row.motherBirthPlace),
      spouseName: s(row.spouseName),
      spouseWork: s(row.spouseWork),
      tin: s(row.tin),
      gsisNo: s(row.gsisNo),
      pagibigNo: s(row.pagibigNo),
      philhealthNo: s(row.philhealthNo),
      address: s(row.address),
      telNo: s(row.telNo),
      cellNo: s(row.cellNo),
      emailAddress: s(row.emailAddress),
      bankAccountNo: s(row.bankAccountNo),
      taxStatus: s(row.taxStatus),
      dateHired: d(row.dateHired),
      hiredDate: d(row.hiredDate),
      appointDate: d(row.appointDate),
      inactive: b(row.inactive),
      dateInactivated: d(row.dateInactivated),
      inactiveCause: s(row.inactiveCause),
      height: n(row.height),
      weight: n(row.weight),
      bloodType: s(row.bloodType),
      idNo: s(row.idNo),
      biometricId: s(row.biometricId),
      pwdType: s(row.pwdType),
      religion: s(row.religion),
      country: s(row.country),
      jobDescription: s(row.jobDescription),
      remarks: s(row.remarks),
      addrUnitNo: s(row.addrUnitNo),
      addrStreet: s(row.addrStreet),
      addrPhase: s(row.addrPhase),
      addrBlockNo: s(row.addrBlockNo),
      addrLot: s(row.addrLot),
      addrBarangay: s(row.addrBarangay),
      addrLocality: s(row.addrLocality),
      addrZip: s(row.addrZip),
      addrTelNo: s(row.addrTelNo),
      permanentAddress: s(row.permanentAddress),
      permanentTelNo: s(row.permanentTelNo),
      permanentZipCode: s(row.permanentZipCode),
      validated: b(row.validated),
      validatedDate: d(row.validatedDate),
      validatedBy: s(row.validatedBy),
      departmentId: deptIdByCode.get(i(row.deptCode)),
    };
    try {
      if (!dryRun) {
        const emp = await prisma.employee.upsert({
          where: { empNo },
          update: data,
          create: { empNo, ...data },
        });
        empIdByNo.set(empNo, emp.id);
      }
      record('employees', 'imported');
    } catch (err) {
      record('employees', 'errored');
      console.error(`  employee ${empNo} error:`, err.message);
    }
  }
  if (dryRun) {
    for (const row of empRows) empIdByNo.set(i(row.empNo), `dry-${row.empNo}`);
  }

  // --- Appointments --------------------------------------------------------
  const apptRows = readTsv('appointments.txt');
  const extraStatusCodes = new Set();
  let existingAppts = new Set();
  if (!dryRun) {
    const existing = await prisma.appointment.findMany({ select: { employeeId: true, effectDate: true, itemNo: true } });
    existingAppts = new Set(existing.map((a) => `${a.employeeId}|${a.effectDate?.toISOString() ?? ''}|${a.itemNo ?? ''}`));
  }
  for (const row of apptRows) {
    const employeeId = empIdByNo.get(i(row.empNo));
    if (!employeeId) {
      record('appointments', 'skipped');
      continue;
    }
    if (row.statusCode && !knownCodes.has(row.statusCode)) extraStatusCodes.add(row.statusCode);

    const effectDate = d(row.effectDate);
    const key = `${employeeId}|${effectDate?.toISOString() ?? ''}|${row.itemNo ?? ''}`;
    if (existingAppts.has(key)) {
      record('appointments', 'skipped');
      continue;
    }

    const data = {
      employeeId,
      departmentId: deptIdByCode.get(i(row.deptCode)),
      positionId: posIdByCode.get(i(row.positionCode)),
      itemNo: s(row.itemNo),
      status: s(row.statusCode),
      employmentStatus: s(row.empStatusRaw),
      appointType: APPOINT_TYPES[i(row.appointType)],
      payMode: PAY_MODES[i(row.payMode)],
      workLevel: WORK_LEVELS[i(row.workLevel)],
      authSalary: n(row.authSalary),
      actualSalary: n(row.actualSalary),
      monthlyRate: n(row.monthlyRate),
      effectDate,
      startDate: d(row.startDate),
      endDate: d(row.endDate),
      exitDate: d(row.exitDate),
      exitCause: s(row.exitCause),
      stepNo: i(row.stepNo),
      grade: i(row.grade),
      sMode: i(row.sMode),
      groupNo: i(row.groupNo),
      assignCode: i(row.assignCode),
    };
    try {
      if (!dryRun) await prisma.appointment.create({ data });
      existingAppts.add(key);
      record('appointments', 'imported');
    } catch (err) {
      record('appointments', 'errored');
      console.error(`  appointment emp=${row.empNo} error:`, err.message);
    }
  }

  // Seed placeholder rows for any status code seen in real Appointment data
  // that isn't in the legacy AppointStatus lookup table itself.
  if (!dryRun) {
    for (const code of extraStatusCodes) {
      try {
        await prisma.appointmentStatusCode.upsert({
          where: { code },
          update: {},
          create: { code, description: code },
        });
        record('appointmentStatusCodes', 'imported');
      } catch (err) {
        record('appointmentStatusCodes', 'errored');
        console.error(`  appointment status ${code} error:`, err.message);
      }
    }
  }

  // --- Dependents (children) ------------------------------------------------
  await importChildTable({
    file: 'dependents.txt',
    table: 'dependents',
    model: dryRun ? null : prisma.dependent,
    keyOf: (data) => `${data.employeeId}|${data.name}|${data.birthDate?.toISOString() ?? ''}`,
    dataOf: (row, employeeId) => ({
      employeeId,
      name: row.name,
      birthDate: d(row.birthDate),
      age: i(row.age),
    }),
  });

  // --- Skills ----------------------------------------------------------------
  await importChildTable({
    file: 'skills.txt',
    table: 'skills',
    model: dryRun ? null : prisma.employeeSkill,
    keyOf: (data) => `${data.employeeId}|${data.name}`,
    dataOf: (row, employeeId) => ({ employeeId, name: row.name }),
  });

  // --- Education ---------------------------------------------------------------
  await importChildTable({
    file: 'education.txt',
    table: 'education',
    model: dryRun ? null : prisma.employeeEducation,
    keyOf: (data) => `${data.employeeId}|${data.level}|${data.schoolName}|${data.schoolYear ?? ''}`,
    dataOf: (row, employeeId) => ({
      employeeId,
      level: row.level || 'Unknown',
      schoolName: row.schoolName || 'Unknown',
      schoolYear: s(row.schoolYear),
      course: s(row.course),
      degree: s(row.degree),
      honors: s(row.honors),
    }),
  });

  // --- Eligibility ---------------------------------------------------------------
  await importChildTable({
    file: 'eligibility.txt',
    table: 'eligibility',
    model: dryRun ? null : prisma.employeeEligibility,
    keyOf: (data) => `${data.employeeId}|${data.examName}|${data.examDate?.toISOString() ?? ''}`,
    dataOf: (row, employeeId) => ({
      employeeId,
      examName: row.examName || 'Unknown',
      examDate: d(row.examDate),
      examPlace: s(row.examPlace),
      rating: s(row.rating),
    }),
  });

  // --- Work experience ---------------------------------------------------------
  await importChildTable({
    file: 'work_experience.txt',
    table: 'workExperience',
    model: dryRun ? null : prisma.employeeWorkExperience,
    keyOf: (data) => `${data.employeeId}|${data.company}|${data.startDate?.toISOString() ?? ''}`,
    dataOf: (row, employeeId) => ({
      employeeId,
      company: row.company || 'Unknown',
      position: s(row.position),
      startDate: d(row.startDate),
      endDate: d(row.endDate),
      salary: n(row.salary),
      salaryUnit: s(row.salaryUnit),
      employmentStatus: s(row.employmentStatus),
    }),
  });

  // --- Training ------------------------------------------------------------------
  await importChildTable({
    file: 'training.txt',
    table: 'training',
    model: dryRun ? null : prisma.employeeTraining,
    keyOf: (data) => `${data.employeeId}|${data.trainingName}|${data.startDate?.toISOString() ?? ''}`,
    dataOf: (row, employeeId) => ({
      employeeId,
      trainingName: row.trainingName || 'Unknown',
      startDate: d(row.startDate),
      endDate: d(row.endDate),
      conductor: s(row.conductor),
      periodCovered: s(row.periodCovered),
      numberOfHours: i(row.numberOfHours),
    }),
  });

  // keyOf operates on the *same post-transform shape* on both sides (an
  // about-to-insert `dataOf(...)` result and an existing DB row read back
  // via findMany) — never on the raw TSV row. That's the fix for a real bug
  // found during verification: dataOf applies `|| 'Unknown'` fallbacks for
  // blank required fields, and keying off the raw (pre-fallback) row value
  // meant a re-run couldn't recognize its own previously-imported rows
  // whenever that fallback had actually fired, re-inserting duplicates.
  async function importChildTable({ file, table, model, keyOf, dataOf }) {
    const rows = readTsv(file);
    let existingKeys = new Set();
    if (!dryRun) {
      // Pull back only what's needed to rebuild the same natural key, one
      // query for the whole table rather than one per row.
      const sample = dataOf(rows[0] ?? {}, 'x');
      const selectFields = Object.fromEntries(Object.keys(sample).map((k) => [k, true]));
      const existing = await model.findMany({ select: selectFields });
      existingKeys = new Set(existing.map((e) => keyOf(e)));
    }

    const toInsert = [];
    for (const row of rows) {
      const employeeId = empIdByNo.get(i(row.empNo));
      if (!employeeId) {
        record(table, 'skipped');
        continue;
      }
      const data = dataOf(row, employeeId);
      const key = keyOf(data);
      if (existingKeys.has(key)) {
        record(table, 'skipped');
        continue;
      }
      existingKeys.add(key);
      toInsert.push(data);
    }

    if (!dryRun) {
      const CHUNK = 500;
      for (let idx = 0; idx < toInsert.length; idx += CHUNK) {
        const chunk = toInsert.slice(idx, idx + CHUNK);
        try {
          await model.createMany({ data: chunk });
          chunk.forEach(() => record(table, 'imported'));
        } catch (err) {
          console.error(`  ${table} batch at ${idx} error:`, err.message);
          chunk.forEach(() => record(table, 'errored'));
        }
      }
    } else {
      toInsert.forEach(() => record(table, 'imported'));
    }
  }

  console.log('\n=== Import summary ===');
  for (const [table, counts] of Object.entries(summary)) {
    console.log(`${table.padEnd(24)} imported=${counts.imported} skipped=${counts.skipped} errored=${counts.errored}`);
  }
  if (extraStatusCodes.size > 0) {
    console.log(`\nUnmapped status codes seeded as placeholders: ${[...extraStatusCodes].join(', ')}`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
