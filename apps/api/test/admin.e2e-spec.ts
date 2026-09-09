import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, seedFixtures, randomCode, type TestFixtures } from './support/test-app.js';

describe('Admin — users, roles, plantilla, salary grades (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fixtures: TestFixtures;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    fixtures = await seedFixtures(app, prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a user with roles', async () => {
    const roles = await request(app.getHttpServer())
      .get('/roles')
      .set('Authorization', `Bearer ${fixtures.administratorToken}`);
    const administratorRole = roles.body.find((r: { name: string }) => r.name === 'Administrator');

    const res = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${fixtures.administratorToken}`)
      .send({
        loginId: `admin-created-${Date.now()}`,
        password: 'Password123!',
        fullName: 'Admin Created User',
        roleIds: [administratorRole.id],
      });

    expect(res.status).toBe(201);
    expect(res.body.roles).toHaveLength(1);
    expect(res.body.roles[0].role.name).toBe('Administrator');
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('creates a role with permissions', async () => {
    const permissions = await request(app.getHttpServer())
      .get('/permissions')
      .set('Authorization', `Bearer ${fixtures.administratorToken}`);
    const permissionIds = permissions.body.slice(0, 2).map((p: { id: string }) => p.id);

    const res = await request(app.getHttpServer())
      .post('/roles')
      .set('Authorization', `Bearer ${fixtures.administratorToken}`)
      .send({ name: `Custom Role ${Date.now()}`, description: 'A test role', permissionIds });

    expect(res.status).toBe(201);
    expect(res.body.permissions).toHaveLength(2);
  });

  it('creates a Plantilla item linked to a real department', async () => {
    const res = await request(app.getHttpServer())
      .post('/plantilla')
      .set('Authorization', `Bearer ${fixtures.administratorToken}`)
      .send({ itemNo: `ITEM-${Date.now()}`, departmentId: fixtures.departmentId, actualSalary: 30000, grade: 12 });

    expect(res.status).toBe(201);
    expect(res.body.department.id).toBe(fixtures.departmentId);
  });

  it('creates a Salary Grade with all 10 steps, positionally numbered', async () => {
    const steps = Array.from({ length: 10 }, (_, i) => ({ amount: 20000 + i * 1000, monthlyRate: 20000 + i * 1000 }));

    const res = await request(app.getHttpServer())
      .post('/salary-grades')
      .set('Authorization', `Bearer ${fixtures.administratorToken}`)
      .send({ gradeNo: randomCode(), steps });

    expect(res.status).toBe(201);
    expect(res.body.steps).toHaveLength(10);
    expect(res.body.steps.map((s: { stepNo: number }) => s.stepNo)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('rejects a Salary Grade with fewer than 10 steps', async () => {
    const res = await request(app.getHttpServer())
      .post('/salary-grades')
      .set('Authorization', `Bearer ${fixtures.administratorToken}`)
      .send({ gradeNo: randomCode(), steps: [{ amount: 1, monthlyRate: 1 }] });

    expect(res.status).toBe(400);
  });
});
