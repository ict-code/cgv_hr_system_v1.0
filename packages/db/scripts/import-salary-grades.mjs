// Imports the real current Salary Grade schedule (legacy SGrade table,
// sgrade-no=20 — "2026 SSL 3rd Tranche MAIN", effective 2026-09-01, the
// sGradeType=1/"Main" default schedule) exported by
// legacy_db/extract_sgrade.p into Postgres via Prisma.
//
// Usage:
//   node scripts/import-salary-grades.mjs --file /path/to/salary_grades.txt [--dry-run]
//
// Each line: gradeNo<TAB>step1Amount<TAB>step2Amount...step10Amount (no header).
// Idempotent: upserts SalaryGrade by its unique gradeNo, then upserts each
// SalaryStep by the (salaryGradeId, stepNo) unique constraint.

import { readFileSync } from 'node:fs';
import { PrismaClient } from '../generated/client/index.js';

const args = process.argv.slice(2);
const fileIndex = args.indexOf('--file');
const filePath = fileIndex >= 0 ? args[fileIndex + 1] : null;
const dryRun = args.includes('--dry-run');

if (!filePath) {
  console.error('Usage: node import-salary-grades.mjs --file <salary_grades.txt> [--dry-run]');
  process.exit(1);
}

const prisma = new PrismaClient();

const text = readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
const lines = text.split('\n').filter((l) => l.length > 0);

let gradesImported = 0;
let stepsImported = 0;

for (const line of lines) {
  const cells = line.split('\t');
  const gradeNo = parseInt(cells[0], 10);
  const stepAmounts = cells.slice(1, 11).map((v) => Number(v));

  if (dryRun) {
    console.log(`[dry-run] grade ${gradeNo}: ${stepAmounts.join(', ')}`);
    continue;
  }

  const grade = await prisma.salaryGrade.upsert({
    where: { gradeNo },
    update: {},
    create: { gradeNo },
  });
  gradesImported++;

  for (let idx = 0; idx < stepAmounts.length; idx++) {
    const stepNo = idx + 1;
    const amount = stepAmounts[idx];
    await prisma.salaryStep.upsert({
      where: { salaryGradeId_stepNo: { salaryGradeId: grade.id, stepNo } },
      update: { amount },
      create: { salaryGradeId: grade.id, stepNo, amount, monthlyRate: 0 },
    });
    stepsImported++;
  }
}

console.log(dryRun ? `[dry-run] would import ${lines.length} grades.` : `Imported/updated ${gradesImported} grades, ${stepsImported} steps.`);

await prisma.$disconnect();
