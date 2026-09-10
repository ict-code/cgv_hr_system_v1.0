import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateAppointmentStatusDto } from './dto/create-appointment-status.dto.js';

@Injectable()
export class AppointmentStatusesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.appointmentStatusCode.findMany({ orderBy: { code: 'asc' } });
  }

  create(dto: CreateAppointmentStatusDto) {
    return this.prisma.appointmentStatusCode.create({ data: dto });
  }
}
