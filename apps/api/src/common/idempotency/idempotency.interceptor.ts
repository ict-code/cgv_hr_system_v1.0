import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Prisma } from '@egaps/db';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../../auth/auth.service.js';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH']);

/**
 * Opt-in idempotency for POST/PUT/PATCH: a request carrying an
 * `Idempotency-Key` header is looked up by (key, method, path) before the
 * handler runs. A hit replays the original stored response verbatim instead
 * of re-executing the handler — protects against duplicate records from a
 * double-click or a client retrying after a dropped response. No header,
 * no lookup, no behavior change — every existing caller is unaffected.
 *
 * Deliberately closes the "sequential retry" window (double-submit, timeout
 * retry), not the true-concurrency race (two requests with the same key
 * in flight at once) — that would need a distributed lock, which this app's
 * write volume doesn't warrant. A concurrent race can still both execute;
 * the second write to `idempotency_keys` just fails its unique constraint
 * and is swallowed, since the real response has already been sent by then.
 *
 * Routes that write the response via @Res() (the two Excel/docx export
 * controllers) resolve `next.handle()` to undefined — storage is skipped
 * for those rather than record a meaningless empty row.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    const key = req.header('Idempotency-Key');
    if (!key || !MUTATING_METHODS.has(req.method)) {
      return next.handle();
    }

    const res = context.switchToHttp().getResponse<Response>();
    const method = req.method;
    const path = req.originalUrl;

    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { key_method_path: { key, method, path } },
    });
    if (existing) {
      res.status(existing.statusCode);
      return of(existing.responseBody);
    }

    // Loosely typed on purpose — Express.Request has no built-in `user`
    // property; the rest of the codebase (e.g. PermissionsGuard) reads it
    // off the request the same untyped-then-cast way.
    const user = (req as unknown as { user?: AuthenticatedUser }).user;

    return next.handle().pipe(
      tap((body) => {
        if (body === undefined) return; // @Res()-handled route — nothing meaningful to store
        const userId = user?.id ?? null;
        this.prisma.idempotencyKey
          .create({
            data: { key, method, path, userId, statusCode: res.statusCode, responseBody: body as Prisma.InputJsonValue },
          })
          .catch(() => {
            // Unique clash (concurrent duplicate) or a non-JSON-serializable
            // body — either way, the real response is already on its way
            // out; never fail the request over a storage miss.
          });
      }),
    );
  }
}
