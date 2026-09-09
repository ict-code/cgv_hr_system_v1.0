import './test-db.js';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { PERMISSION_CATALOG, permissionKey } from '../../src/auth/permission.constant.js';

export interface TestFixtures {
  departmentId: string;
  positionId: string;
  employeeId: string;
  administratorToken: string;
  hrStaffToken: string;
}

export async function createTestApp(): Promise<{ app: INestApplication; prisma: PrismaService }> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.init();
  const prisma = moduleRef.get(PrismaService);
  return { app, prisma };
}

async function login(app: INestApplication, loginId: string, password: string): Promise<string> {
  const res = await request(app.getHttpServer()).post('/auth/login').send({ loginId, password });
  if (res.status >= 400) throw new Error(`Login failed for ${loginId}: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.accessToken;
}

const HR_STAFF_PERMISSIONS = new Set([
  'personnel:view',
  'personnel:create',
  'personnel:edit',
  'departments:view',
  'departments:create',
  'positions:view',
  'positions:create',
]);

/** Creates an isolated set of fixtures (unique codes per call) so parallel suites never collide. */
export async function seedFixtures(app: INestApplication, prisma: PrismaService): Promise<TestFixtures> {
  const suffix = Math.floor(Math.random() * 1_000_000);
  const testPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(testPassword, 4);

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
    create: { name: 'HR Staff', description: 'Personnel and master data only' },
  });

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: administratorRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: administratorRole.id, permissionId: permission.id },
    });
    if (HR_STAFF_PERMISSIONS.has(permissionKey(permission.module, permission.action))) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: hrStaffRole.id, permissionId: permission.id } },
        update: {},
        create: { roleId: hrStaffRole.id, permissionId: permission.id },
      });
    }
  }

  const administratorUser = await prisma.user.create({
    data: { loginId: `admin-${suffix}`, passwordHash, fullName: 'Test Administrator' },
  });
  await prisma.userRole.create({ data: { userId: administratorUser.id, roleId: administratorRole.id } });

  const hrStaffUser = await prisma.user.create({
    data: { loginId: `hrstaff-${suffix}`, passwordHash, fullName: 'Test HR Staff' },
  });
  await prisma.userRole.create({ data: { userId: hrStaffUser.id, roleId: hrStaffRole.id } });

  const department = await prisma.department.create({
    data: { deptCode: suffix, deptDesc: `Test Department ${suffix}` },
  });
  const position = await prisma.position.create({
    data: { positionCode: suffix, positionDesc: `Test Position ${suffix}` },
  });
  const employee = await prisma.employee.create({
    data: { empNo: suffix, lastName: `TestLast${suffix}`, firstName: 'TestFirst' },
  });

  const [administratorToken, hrStaffToken] = await Promise.all([
    login(app, `admin-${suffix}`, testPassword),
    login(app, `hrstaff-${suffix}`, testPassword),
  ]);

  return {
    departmentId: department.id,
    positionId: position.id,
    employeeId: employee.id,
    administratorToken,
    hrStaffToken,
  };
}

export function randomCode(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}
