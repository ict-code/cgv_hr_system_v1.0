import { describe, expect, it } from 'vitest';
import { AppointmentsService } from './appointments.service.js';
import type { AuthenticatedUser } from '../auth/auth.service.js';
import type { RecordAppointmentChangeDto } from './dto/record-appointment-change.dto.js';

type FakeRow = Record<string, unknown> & { id: string };

/**
 * A minimal in-memory double for PrismaService, covering only the calls
 * AppointmentsService actually makes. $transaction just invokes the callback
 * with `this` — good enough since nothing here needs real isolation.
 */
function createFakePrisma() {
  const state = {
    employees: new Map<string, FakeRow>(),
    departments: new Map<string, FakeRow>(),
    positions: new Map<string, FakeRow>(),
    appointments: new Map<string, FakeRow>(),
    changeLogs: [] as FakeRow[],
    serviceRecords: new Map<string, FakeRow>(),
  };
  let nextId = 1;
  const id = () => `id-${nextId++}`;

  const tx = {
    department: { findUnique: async ({ where }: any) => state.departments.get(where.id) ?? null },
    position: { findUnique: async ({ where }: any) => state.positions.get(where.id) ?? null },
    appointment: {
      findFirst: async ({ where }: any) => {
        const rows = [...state.appointments.values()].filter((r) => r.employeeId === where.employeeId);
        return rows[rows.length - 1] ?? null;
      },
      update: async ({ where, data }: any) => {
        const row = { ...state.appointments.get(where.id), ...data };
        state.appointments.set(where.id, row);
        return row;
      },
      create: async ({ data }: any) => {
        const row = { id: id(), ...data };
        state.appointments.set(row.id, row);
        return row;
      },
    },
    appointmentChangeLog: {
      create: async ({ data }: any) => {
        const row = { id: id(), ...data };
        state.changeLogs.push(row);
        return row;
      },
    },
    serviceRecord: {
      findFirst: async ({ where }: any) => {
        const rows = [...state.serviceRecords.values()].filter(
          (r) => r.employeeId === where.employeeId && r.endDate === null,
        );
        return rows[rows.length - 1] ?? null;
      },
      update: async ({ where, data }: any) => {
        const row = { ...state.serviceRecords.get(where.id), ...data };
        state.serviceRecords.set(where.id, row);
        return row;
      },
      create: async ({ data }: any) => {
        const row = { id: id(), endDate: null, ...data };
        state.serviceRecords.set(row.id, row);
        return row;
      },
    },
  };

  return {
    state,
    prisma: {
      employee: { findUnique: async ({ where }: any) => state.employees.get(where.id) ?? null },
      $transaction: async (fn: (tx: typeof tx) => Promise<unknown>) => fn(tx),
    },
  };
}

const user: AuthenticatedUser = { id: 'user-1', loginId: 'tester', fullName: 'Tester', permissions: [] };

function baseDto(overrides: Partial<RecordAppointmentChangeDto> = {}): RecordAppointmentChangeDto {
  return {
    status: 'OA',
    effectDate: new Date('2026-01-01'),
    ...overrides,
  } as RecordAppointmentChangeDto;
}

describe('AppointmentsService.recordChange', () => {
  it('creates a new Appointment when the employee has none yet', async () => {
    const { prisma, state } = createFakePrisma();
    state.employees.set('emp-1', { id: 'emp-1' });
    const service = new AppointmentsService(prisma as any);

    const result = await service.recordChange('emp-1', baseDto(), user);

    expect(state.appointments.size).toBe(1);
    expect(result.appointment.employeeId).toBe('emp-1');
    expect(result.appointment.status).toBe('OA');
  });

  it('updates the existing Appointment in place (same id) on a second change', async () => {
    const { prisma, state } = createFakePrisma();
    state.employees.set('emp-1', { id: 'emp-1' });
    const service = new AppointmentsService(prisma as any);

    const first = await service.recordChange('emp-1', baseDto({ status: 'OA', actualSalary: 25000 }), user);
    const second = await service.recordChange(
      'emp-1',
      baseDto({ status: 'SA', effectDate: new Date('2026-02-01'), actualSalary: 28000 }),
      user,
    );

    expect(state.appointments.size).toBe(1);
    expect(second.appointment.id).toBe(first.appointment.id);
    expect(second.appointment.status).toBe('SA');
    expect(second.appointment.actualSalary).toBe(28000);
  });

  it('derives sMode=2 (inactive) for a separation status and sMode=1 otherwise', async () => {
    const { prisma, state } = createFakePrisma();
    state.employees.set('emp-1', { id: 'emp-1' });
    const service = new AppointmentsService(prisma as any);

    const active = await service.recordChange('emp-1', baseDto({ status: 'OA' }), user);
    expect(active.appointment.sMode).toBe(1);

    const separated = await service.recordChange(
      'emp-1',
      baseDto({ status: 'RS', effectDate: new Date('2026-03-01') }),
      user,
    );
    expect(separated.appointment.sMode).toBe(2);
  });

  it('captures the correct before/after snapshot in the change log', async () => {
    const { prisma, state } = createFakePrisma();
    state.employees.set('emp-1', { id: 'emp-1' });
    const service = new AppointmentsService(prisma as any);

    await service.recordChange('emp-1', baseDto({ status: 'OA', actualSalary: 25000, grade: 10 }), user);
    const result = await service.recordChange(
      'emp-1',
      baseDto({ status: 'SA', effectDate: new Date('2026-02-01'), actualSalary: 28000, grade: 11 }),
      user,
    );

    expect(result.changeLog.oldStatusCode).toBe('OA');
    expect(result.changeLog.statusCode).toBe('SA');
    expect(result.changeLog.oldActlSalary).toBe(25000);
    expect(result.changeLog.actlSalary).toBe(28000);
    expect(result.changeLog.oldGrade).toBe(10);
    expect(result.changeLog.grade).toBe(11);
    expect(result.changeLog.changedByUserId).toBe('user-1');
  });

  it('closes the previously open ServiceRecord and opens a new one', async () => {
    const { prisma, state } = createFakePrisma();
    state.employees.set('emp-1', { id: 'emp-1' });
    const service = new AppointmentsService(prisma as any);

    const first = await service.recordChange('emp-1', baseDto({ status: 'OA' }), user);
    const second = await service.recordChange(
      'emp-1',
      baseDto({ status: 'SA', effectDate: new Date('2026-02-01') }),
      user,
    );

    const firstRecord = state.serviceRecords.get(first.serviceRecord.id)!;
    expect(firstRecord.endDate).toEqual(new Date('2026-02-01'));
    expect(second.serviceRecord.endDate).toBeNull();
    expect(state.serviceRecords.size).toBe(2);
  });
});
