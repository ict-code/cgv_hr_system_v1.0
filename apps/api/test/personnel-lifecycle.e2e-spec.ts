import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, seedFixtures, randomCode, type TestFixtures } from './support/test-app.js';

describe('Personnel lifecycle (e2e)', () => {
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

  it('records two appointment changes, updating the Appointment in place and chaining ServiceRecord', async () => {
    const auth = { Authorization: `Bearer ${fixtures.administratorToken}` };

    const employee = await request(app.getHttpServer())
      .post('/employees')
      .set(auth)
      .send({ empNo: randomCode(), lastName: 'LifecycleTest', firstName: 'Employee' });
    expect(employee.status).toBe(201);
    const employeeId = employee.body.id;

    const first = await request(app.getHttpServer())
      .post(`/employees/${employeeId}/appointments`)
      .set(auth)
      .send({
        status: 'OA',
        effectDate: '2026-01-01',
        departmentId: fixtures.departmentId,
        positionId: fixtures.positionId,
        actualSalary: 25000,
        grade: 10,
        stepNo: 1,
      });
    expect(first.status).toBe(201);
    const firstAppointmentId = first.body.appointment.id;
    const firstServiceRecordId = first.body.serviceRecord.id;

    const second = await request(app.getHttpServer())
      .post(`/employees/${employeeId}/appointments`)
      .set(auth)
      .send({ status: 'SA', effectDate: '2026-02-01', actualSalary: 28000, grade: 11, stepNo: 1 });
    expect(second.status).toBe(201);

    // Appointment overwritten in place — same id, new values.
    expect(second.body.appointment.id).toBe(firstAppointmentId);
    expect(second.body.appointment.status).toBe('SA');
    expect(second.body.appointment.actualSalary).toBe('28000');

    // Change log captured the correct before/after snapshot.
    expect(second.body.changeLog.oldStatusCode).toBe('OA');
    expect(second.body.changeLog.statusCode).toBe('SA');
    expect(second.body.changeLog.oldActlSalary).toBe('25000');
    expect(second.body.changeLog.actlSalary).toBe('28000');

    // ServiceRecord chaining: first closed at the second's effectDate, second open.
    const serviceRecords = await request(app.getHttpServer())
      .get(`/employees/${employeeId}/service-records`)
      .set(auth);
    expect(serviceRecords.status).toBe(200);
    expect(serviceRecords.body).toHaveLength(2);
    const closed = serviceRecords.body.find((r: { id: string }) => r.id === firstServiceRecordId);
    expect(closed.endDate).toBe('2026-02-01T00:00:00.000Z');
    expect(second.body.serviceRecord.endDate).toBeNull();

    const changeLogs = await request(app.getHttpServer())
      .get(`/employees/${employeeId}/change-logs`)
      .set(auth);
    expect(changeLogs.body).toHaveLength(2);
  });

  it('creates a department and a position (master data pattern shared by both resources)', async () => {
    const auth = { Authorization: `Bearer ${fixtures.administratorToken}` };

    const dept = await request(app.getHttpServer())
      .post('/departments')
      .set(auth)
      .send({ deptCode: randomCode(), deptDesc: 'Master Data Test Dept' });
    expect(dept.status).toBe(201);

    const position = await request(app.getHttpServer())
      .post('/positions')
      .set(auth)
      .send({ positionCode: randomCode(), positionDesc: 'Master Data Test Position' });
    expect(position.status).toBe(201);
  });
});
