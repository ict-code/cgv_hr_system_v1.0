import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export type AuditEntry = {
  userId?: string | null;
  module: string;
  action: string;
  description: string;
  outcome: 'success' | 'denied' | 'error';
  ipAddress?: string | null;
};

/**
 * Replicates the legacy Audit-Hdr concept (SECURITY_ANALYSIS.md §6): who,
 * when, module, action, outcome. Called explicitly from write paths rather
 * than via a generic interceptor, so each entry's fields stay meaningful and
 * verifiable against the legacy model — see the approved plan.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry) {
    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        module: entry.module,
        action: entry.action,
        description: entry.description,
        outcome: entry.outcome,
        ipAddress: entry.ipAddress ?? null,
      },
    });
  }
}
