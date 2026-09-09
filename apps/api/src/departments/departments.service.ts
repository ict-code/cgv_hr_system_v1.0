import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateDepartmentDto } from './dto/create-department.dto.js';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.department.findMany({ orderBy: { deptDesc: 'asc' } });
  }

  create(dto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: dto });
  }
}
