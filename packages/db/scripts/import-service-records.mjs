// Backfills the real Service Records File (legacy `app-change` table —
// the append-only internal appointment-change audit trail, 6,985 rows)
// exported by legacy_db/extract_appchange.p into our ServiceRecord model.
//
// Usage:
//   node scripts/import-service-records.mjs --dir /path/to/export [--dry-run]
//
// app-change.start-date/end-date are unset in every real row (confirmed
// 2026-09-11) — legacy derives the period the same way our own
// appointments.service.ts recordChange() does: chain consecutive
// effect-dates per employee. Row N's effectDate is its period start; row
// N+1's effectDate (if any) closes it. The last row per employee gets
// endDate=null (the open/current period), matching recordChange()'s own
// invariant so any future real change made through the app closes it
// correctly.
//
// Not idempotent by design — run once against an empty service_records
// table (deletes nothing itself, but re-running after a partial success
// would duplicate rows since there's no natural unique key here). Wipe
// the table first if re-running.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '../generated/client/index.js';

const args = process.argv.slice(2);
const dirIndex = args.indexOf('--dir');
const exportDir = dirIndex >= 0 ? args[dirIndex + 1] : null;
const dryRun = args.includes('--dry-run');

if (!exportDir) {
  console.error('Usage: node import-service-records.mjs --dir <export-dir> [--dry-run]');
  process.exit(1);
}

const prisma = new PrismaClient();

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
// Progress date format from this export is MM/DD/YY — "?" is Progress's own
// literal for an unknown/unset date (6 of 6,985 real rows).
function d(v) {
  if (v === '' || v === '?' || v === undefined) return undefined;
  const [m, day, y] = v.split('/').map(Number);
  const fullYear = y < 100 ? 2000 + y : y;
  return new Date(Date.UTC(fullYear, m - 1, day));
}

const [employees, departments, positions] = await Promise.all([
  prisma.employee.findMany({ select: { id: true, empNo: true } }),
  prisma.department.findMany({ select: { id: true, deptCode: true, deptDesc: true } }),
  prisma.position.findMany({ select: { id: true, positionCode: true, positionDesc: true } }),
]);
const employeeIdByEmpNo = new Map(employees.map((e) => [e.empNo, e.id]));
const deptDescByCode = new Map(departments.map((d) => [d.deptCode, d.deptDesc]));
const posDescByCode = new Map(positions.map((p) => [p.positionCode, p.positionDesc]));

const rows = readTsv('app_change.txt');

// Group by empNo, preserving the file's own emp-no -> effect-date -> record-no order.
const byEmpNo = new Map();
for (const row of rows) {
  const empNo = i(row.empNo);
  if (empNo === undefined) continue;
  if (!byEmpNo.has(empNo)) byEmpNo.set(empNo, []);
  byEmpNo.get(empNo).push(row);
}

let created = 0;
let skippedNoEmployee = 0;
let skippedNoDate = 0;

for (const [empNo, empRows] of byEmpNo) {
  const employeeId = employeeIdByEmpNo.get(empNo);
  if (!employeeId) {
    skippedNoEmployee += empRows.length;
    continue;
  }

  // Collapse same-day duplicate changes to the last one recorded that day
  // (file is already ordered by effect-date, record-no).
  const byDate = new Map();
  for (const row of empRows) {
    const date = d(row.effectDate);
    if (!date) continue;
    byDate.set(date.toISOString(), row);
  }
  const chain = [...byDate.entries()].sort(([a], [b]) => (a < b ? -1 : 1));

  for (let idx = 0; idx < chain.length; idx++) {
    const [, row] = chain[idx];
    const startDate = d(row.effectDate);
    if (!startDate) {
      skippedNoDate++;
      continue;
    }
    const endDate = idx < chain.length - 1 ? new Date(chain[idx + 1][0]) : null;

    const deptCode = i(row.deptCode);
    const positionCode = i(row.positionCode);
    const monthlyRate = n(row.monthlyRate);
    const actlSalary = n(row.actlSalary);

    const data = {
      employeeId,
      startDate,
      endDate: endDate ?? null,
      positionSnapshot: positionCode ? (posDescByCode.get(positionCode) ?? undefined) : undefined,
      departmentSnapshot: deptCode ? (deptDescByCode.get(deptCode) ?? undefined) : undefined,
      empStatusSnapshot: s(row.empStatus),
      salarySnapshot: monthlyRate || actlSalary || undefined,
      salaryUnitSnapshot: monthlyRate || actlSalary ? 'Monthly' : undefined,
      grade: i(row.grade),
      step: i(row.step),
      itemNo: s(row.itemNo),
    };

    if (dryRun) {
      created++;
      continue;
    }

    await prisma.serviceRecord.create({ data });
    created++;
  }
}

console.log(
  dryRun
    ? `[dry-run] would create ${created} service records (${skippedNoEmployee} rows skipped: unknown employee, ${skippedNoDate} skipped: no date).`
    : `Created ${created} service records (${skippedNoEmployee} rows skipped: unknown employee, ${skippedNoDate} skipped: no date).`,
);

await prisma.$disconnect();
