import { PrismaClient } from '@egaps/db';
import bcrypt from 'bcrypt';

// Mirrors apps/api/src/auth/permission.constant.ts's PERMISSION_CATALOG —
// duplicated here since this script runs as plain JS (no TS loader in the
// deploy image), not imported from the TS source.
const PERMISSION_CATALOG = [
  ['personnel', 'view'],
  ['personnel', 'create'],
  ['personnel', 'edit'],
  ['departments', 'view'],
  ['departments', 'create'],
  ['positions', 'view'],
  ['positions', 'create'],
  ['plantilla', 'view'],
  ['plantilla', 'create'],
  ['plantilla', 'edit'],
  ['plantilla', 'delete'],
  ['salaryGrades', 'view'],
  ['salaryGrades', 'create'],
  ['salaryGrades', 'edit'],
  ['salaryGrades', 'delete'],
  ['users', 'view'],
  ['users', 'create'],
  ['users', 'edit'],
  ['roles', 'view'],
  ['roles', 'create'],
  ['appointmentStatuses', 'view'],
  ['appointmentStatuses', 'create'],
  ['appointmentStatuses', 'edit'],
  ['appointmentStatuses', 'delete'],
  ['employmentStatuses', 'view'],
  ['employmentStatuses', 'create'],
  ['employmentStatuses', 'edit'],
  ['employmentStatuses', 'delete'],
  ['branding', 'edit'],
];

const HR_STAFF_PERMISSIONS = new Set([
  'personnel:view',
  'personnel:create',
  'personnel:edit',
  'departments:view',
  'departments:create',
  'positions:view',
  'positions:create',
  'plantilla:view',
  'plantilla:create',
  'plantilla:edit',
  'plantilla:delete',
  'salaryGrades:view',
  'salaryGrades:create',
  'salaryGrades:edit',
  'salaryGrades:delete',
  'appointmentStatuses:view',
  'appointmentStatuses:create',
  'appointmentStatuses:edit',
  'appointmentStatuses:delete',
  'employmentStatuses:view',
  'employmentStatuses:create',
  'employmentStatuses:edit',
  'employmentStatuses:delete',
]);

const loginId = process.env.SEED_ADMIN_LOGIN_ID ?? 'admin';
const password = process.env.SEED_ADMIN_PASSWORD;
const fullName = process.env.SEED_ADMIN_FULL_NAME ?? 'System Administrator';

if (!password) {
  console.error('SEED_ADMIN_PASSWORD env var is required.');
  process.exit(1);
}

const prisma = new PrismaClient();

const permissions = await Promise.all(
  PERMISSION_CATALOG.map(([module, action]) =>
    prisma.permission.upsert({
      where: { module_action: { module, action } },
      update: {},
      create: { module, action },
    }),
  ),
);

const administratorRole = await prisma.role.upsert({
  where: { name: 'Administrator' },
  update: {},
  create: { name: 'Administrator', description: 'Full system access' },
});

const hrStaffRole = await prisma.role.upsert({
  where: { name: 'HR Staff' },
  update: {},
  create: { name: 'HR Staff', description: 'Personnel and master data — no user/role administration' },
});

for (const permission of permissions) {
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: administratorRole.id, permissionId: permission.id } },
    update: {},
    create: { roleId: administratorRole.id, permissionId: permission.id },
  });

  const key = `${permission.module}:${permission.action}`;
  if (HR_STAFF_PERMISSIONS.has(key)) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: hrStaffRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: hrStaffRole.id, permissionId: permission.id },
    });
  }
}

const passwordHash = await bcrypt.hash(password, 10);

const user = await prisma.user.upsert({
  where: { loginId },
  update: { passwordHash, fullName, active: true },
  create: { loginId, passwordHash, fullName, active: true },
});

await prisma.userRole.upsert({
  where: { userId_roleId: { userId: user.id, roleId: administratorRole.id } },
  update: {},
  create: { userId: user.id, roleId: administratorRole.id },
});

console.log(`Seeded permission catalog (${permissions.length} entries), Administrator + HR Staff roles.`);
console.log(`Seeded admin user "${user.loginId}" (id: ${user.id}) with the Administrator role.`);

await prisma.$disconnect();
