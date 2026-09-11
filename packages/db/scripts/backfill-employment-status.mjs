// One-time corrective backfill: the original personnel data import (see
// import-legacy-data.mjs) mapped the real Appointment.Emp-Status raw code
// (P/CS/CL/CT/EL — see Master Data > Employment Status File) through a lossy
// EMP_STATUS_MAP into the old EmploymentStatus enum (REGULAR/CASUAL/...),
// dropping EL (Elected, 20 rows) entirely since it had no matching enum
// member. Now that employmentStatus is a plain string, this rewrites every
// already-imported Appointment row back to the real raw code from the
// original export, using the same natural key
// (employeeId|effectDate|itemNo) the importer used to dedupe.
//
// Usage:
//   node scripts/backfill-employment-status.mjs --file /path/to/appointments.txt [--dry-run]

import { readFileSync } from 'node:fs';
import { PrismaClient } from '../generated/client/index.js';

const args = process.argv.slice(2);
const fileIndex = args.indexOf('--file');
const filePath = fileIndex >= 0 ? args[fileIndex + 1] : null;
const dryRun = args.includes('--dry-run');

if (!filePath) {
  console.error('Usage: node backfill-employment-status.mjs --file <appointments.txt> [--dry-run]');
  process.exit(1);
}

const prisma = new PrismaClient();

function readTsv(path) {
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

const employees = await prisma.employee.findMany({ select: { id: true, empNo: true } });
const employeeIdByEmpNo = new Map(employees.map((e) => [e.empNo, e.id]));

const rows = readTsv(filePath);

let updated = 0;
let skipped = 0;

for (const row of rows) {
  const employeeId = employeeIdByEmpNo.get(parseInt(row.empNo, 10));
  const rawStatus = row.empStatusRaw || null;
  if (!employeeId || !rawStatus) {
    skipped++;
    continue;
  }

  const effectDate = row.effectDate ? new Date(row.effectDate) : null;

  if (dryRun) {
    console.log(`[dry-run] emp=${row.empNo} effectDate=${row.effectDate} itemNo=${row.itemNo || ''} -> ${rawStatus}`);
    updated++;
    continue;
  }

  const result = await prisma.appointment.updateMany({
    where: {
      employeeId,
      effectDate,
      itemNo: row.itemNo || null,
    },
    data: { employmentStatus: rawStatus },
  });

  if (result.count > 0) updated += result.count;
  else skipped++;
}

console.log(dryRun ? `[dry-run] would update ${updated} appointments (${skipped} skipped).` : `Updated ${updated} appointments (${skipped} skipped).`);

await prisma.$disconnect();
