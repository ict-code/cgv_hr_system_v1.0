// Imports the real Employment Status File (legacy EmployType table:
// emp-status/emp-desc — the employee's tenure classification, e.g.
// Permanent/Casual/Job Order, distinct from AppointmentStatusCode which
// tracks the *action* taken on an appointment) exported by
// legacy_db/extract_employtype.p into Postgres via Prisma.
//
// Usage:
//   node scripts/import-employment-statuses.mjs --file /path/to/employment_statuses.txt [--dry-run]
//
// Each line: code<TAB>description (no header). Idempotent: upserts by the
// unique code.

import { readFileSync } from 'node:fs';
import { PrismaClient } from '../generated/client/index.js';

const args = process.argv.slice(2);
const fileIndex = args.indexOf('--file');
const filePath = fileIndex >= 0 ? args[fileIndex + 1] : null;
const dryRun = args.includes('--dry-run');

if (!filePath) {
  console.error('Usage: node import-employment-statuses.mjs --file <employment_statuses.txt> [--dry-run]');
  process.exit(1);
}

const prisma = new PrismaClient();

const text = readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
const lines = text.split('\n').filter((l) => l.length > 0);

let imported = 0;

for (const line of lines) {
  const [code, description] = line.split('\t');

  if (dryRun) {
    console.log(`[dry-run] ${code}: ${description}`);
    continue;
  }

  await prisma.employmentStatusCode.upsert({
    where: { code },
    update: { description },
    create: { code, description },
  });
  imported++;
}

console.log(dryRun ? `[dry-run] would import ${lines.length} employment statuses.` : `Imported/updated ${imported} employment statuses.`);

await prisma.$disconnect();
