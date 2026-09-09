import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreatePositionDto } from './dto/create-position.dto.js';

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.position.findMany({ orderBy: { positionDesc: 'asc' } });
  }

  create(dto: CreatePositionDto) {
    return this.prisma.position.create({ data: dto });
  }
}
