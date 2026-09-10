import { Injectable } from '@nestjs/common';
import type { Prisma, AppointmentStatusCode } from '@egaps/db';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateAppointmentStatusDto } from './dto/create-appointment-status.dto.js';
import type { ListQueryDto, PaginatedResult } from '../common/dto/list-query.dto.js';

@Injectable()
export class AppointmentStatusesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListQueryDto): Promise<PaginatedResult<AppointmentStatusCode>> {
    const where: Prisma.AppointmentStatusCodeWhereInput = query.search
      ? {
          OR: [
            { code: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.appointmentStatusCode.findMany({
        where,
        orderBy: { code: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.appointmentStatusCode.count({ where }),
    ]);

    return { data, total, page: query.page, pageSize: query.pageSize };
  }

  create(dto: CreateAppointmentStatusDto) {
    return this.prisma.appointmentStatusCode.create({ data: dto });
  }
}
