import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, seedFixtures, type TestFixtures } from './support/test-app.js';

describe('Auth (e2e)', () => {
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

  it('rejects a wrong password with 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ loginId: 'admin-does-not-matter', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('rejects a request with no token with 401', async () => {
    const res = await request(app.getHttpServer()).get('/employees');
    expect(res.status).toBe(401);
  });

  it('rejects an HR Staff token on a users:create-gated endpoint with 403', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${fixtures.hrStaffToken}`)
      .send({ loginId: 'x', password: 'Password123!', fullName: 'X', roleIds: [] });
    expect(res.status).toBe(403);
  });

  it('allows an Administrator token on the same endpoint', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${fixtures.administratorToken}`)
      .send({ loginId: `newuser-${Date.now()}`, password: 'Password123!', fullName: 'New User', roleIds: [] });
    expect(res.status).toBe(201);
  });
});
