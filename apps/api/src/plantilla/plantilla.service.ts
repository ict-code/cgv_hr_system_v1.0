import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreatePlantillaDto } from './dto/create-plantilla.dto.js';

@Injectable()
export class PlantillaService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.plantilla.findMany({
      include: { department: true, position: true },
      orderBy: { itemNo: 'asc' },
    });
  }

  create(dto: CreatePlantillaDto) {
    return this.prisma.plantilla.create({
      data: dto,
      include: { department: true, position: true },
    });
  }
}
