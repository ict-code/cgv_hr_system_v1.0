// Real headless-browser click-through of the actual running app (not an
// HTTP-level check). Login -> employees list -> key admin pages render ->
// create a Department through its real dialog form -> create an employee ->
// record an appointment change through the real form and see it land in
// the change log table.
//
// Usage: node scripts/browser-smoke-test.mjs
// Env: SMOKE_BASE_URL (default http://192.168.11.246), ADMIN_LOGIN_ID, ADMIN_PASSWORD

import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE_URL ?? 'http://192.168.11.246';
const LOGIN_ID = process.env.ADMIN_LOGIN_ID ?? 'admin';
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!PASSWORD) {
  console.error('Set ADMIN_PASSWORD to run the smoke test.');
  process.exit(1);
}

const steps = [];
function step(name, fn) {
  steps.push({ name, fn });
}

step('login redirects to /dashboard', async (page) => {
  await page.goto(`${BASE}/login`);
  await page.getByLabel(/login id/i).fill(LOGIN_ID);
  await page.getByLabel(/^password$/i).fill(PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard$/, { timeout: 10_000 });
});

step('dashboard renders real content', async (page) => {
  await page.waitForSelector('text=/welcome/i', { timeout: 10_000 });
  const bodyText = await page.textContent('body');
  if (!bodyText || bodyText.trim().length < 50) throw new Error('Dashboard page body looks empty');
});

for (const path of ['/employees', '/departments', '/positions', '/plantilla', '/salary-grades', '/users', '/roles']) {
  step(`${path} renders without a client error`, async (page) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(`${BASE}${path}`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    if (errors.length > 0) throw new Error(`Client-side error(s): ${errors.join('; ')}`);
  });
}

const deptDesc = `Smoke Test Dept ${Date.now()}`;

step('create a Department through its dialog form and see it in the table', async (page) => {
  const deptCode = String(Date.now()).slice(-6);
  await page.goto(`${BASE}/departments`);
  await page.getByRole('button', { name: /^new$/i }).click();
  await page.getByLabel(/department code/i).fill(deptCode);
  await page.getByLabel(/^description$/i).fill(deptDesc);
  await page.getByRole('button', { name: /^save$/i }).click();
  await page.waitForSelector(`text=${deptDesc}`, { timeout: 10_000 });
});

let employeeId;
const empNo = String(Date.now()).slice(-6);

step('create an employee through the real form', async (page) => {
  await page.goto(`${BASE}/employees/new`);
  await page.getByLabel(/employee no/i).fill(empNo);
  await page.getByLabel(/last name/i).fill('SmokeTest');
  await page.getByLabel(/first name/i).fill('Browser');
  await page.getByRole('button', { name: /create employee/i }).click();
  // Careful: /\/employees\/[^/]+$/ also matches /employees/new itself ("new"
  // satisfies [^/]+), so it can resolve before the real client-side redirect
  // happens. Exclude "new" explicitly.
  await page.waitForURL(/\/employees\/(?!new$)[^/]+$/, { timeout: 10_000 });
  employeeId = new URL(page.url()).pathname.split('/').pop();
  if (!employeeId) throw new Error('Did not land on an employee detail page');
});

step('record an appointment change through the real form and see it in the change log', async (page) => {
  await page.goto(`${BASE}/employees/${employeeId}`);
  await page.getByLabel(/change type/i).selectOption('OA');
  await page.getByLabel(/effective date/i).fill('2026-01-01');
  await page.getByRole('button', { name: /record change/i }).click();
  await page.waitForSelector('text=/OA/', { timeout: 10_000 });
});

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let failed = 0;

  for (const { name, fn } of steps) {
    try {
      await fn(page);
      console.log(`PASS  ${name}`);
    } catch (err) {
      failed++;
      console.log(`FAIL  ${name}`);
      console.log(`      ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  await browser.close();
  console.log(`\n${steps.length - failed}/${steps.length} passed`);
  process.exitCode = failed > 0 ? 1 : 0;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
