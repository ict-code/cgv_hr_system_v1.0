// Imports the real Plantilla Positions File (legacy `plantilla` table,
// Type=1/"Regular" — 855 rows) exported by legacy_db/extract_plantilla.p
// into Postgres via Prisma.
//
// Usage:
//   node scripts/import-plantilla.mjs --dir /path/to/export [--dry-run]
//
// Resolves departmentId/positionId/employeeId via existing Department/
// Position/Employee rows (already imported). divisionId is left null for
// every row — no Division File/master-data import exists yet (only 59 of
// 855 real rows carry a non-zero Div-Code anyway). Idempotent: upserts by
// the (departmentId, itemNo) unique constraint — itemNo alone is NOT
// globally unique in the real data (21 of 855 item numbers are reused
// across different departments).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '../generated/client/index.js';

const args = process.argv.slice(2);
const dirIndex = args.indexOf('--dir');
const exportDir = dirIndex >= 0 ? args[dirIndex + 1] : null;
const dryRun = args.includes('--dry-run');

if (!exportDir) {
  console.error('Usage: node import-plantilla.mjs --dir <export-dir> [--dry-run]');
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
    header.forEach((col, idx) => (row[col] = cells[idx] ?? ''));
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

const [departments, positions, employees] = await Promise.all([
  prisma.department.findMany({ select: { id: true, deptCode: true } }),
  prisma.position.findMany({ select: { id: true, positionCode: true } }),
  prisma.employee.findMany({ select: { id: true, empNo: true } }),
]);
const deptIdByCode = new Map(departments.map((d) => [d.deptCode, d.id]));
const posIdByCode = new Map(positions.map((p) => [p.positionCode, p.id]));
const empIdByNo = new Map(employees.map((e) => [e.empNo, e.id]));

const rows = readTsv('plantilla.txt');

let imported = 0;
let skipped = 0;
let vacant = 0;

for (const row of rows) {
  const departmentId = deptIdByCode.get(i(row.deptCode));
  if (!departmentId) {
    console.error(`  skip item ${row.itemNo}: unknown deptCode ${row.deptCode}`);
    skipped++;
    continue;
  }

  const empNo = i(row.empNo);
  const employeeId = empNo ? empIdByNo.get(empNo) : undefined;
  if (!employeeId) vacant++;

  const data = {
    itemNo: row.itemNo,
    oldItemNo: s(row.oldItemNo),
    departmentId,
    positionId: posIdByCode.get(i(row.positionCode)),
    employeeId,
    grade: i(row.grade),
    step: i(row.step),
    actualSalary: n(row.actualSalary),
    authSalary: n(row.authSalary),
    pageNo: i(row.pageNo),
    partTime: row.partTime === 'yes',
  };

  if (dryRun) {
    console.log(`[dry-run] item ${row.itemNo}: dept=${row.deptCode} emp=${row.empNo || '(vacant)'} grade=${row.grade}/${row.step}`);
    imported++;
    continue;
  }

  await prisma.plantilla.upsert({
    where: { departmentId_itemNo: { departmentId, itemNo: row.itemNo } },
    update: data,
    create: data,
  });
  imported++;
}

console.log(
  dryRun
    ? `[dry-run] would import ${imported} plantilla items (${skipped} skipped, ${vacant} vacant).`
    : `Imported/updated ${imported} plantilla items (${skipped} skipped, ${vacant} vacant).`,
);

await prisma.$disconnect();
