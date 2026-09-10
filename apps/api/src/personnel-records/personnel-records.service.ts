import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateEducationDto } from './dto/create-education.dto.js';
import type { CreateEligibilityDto } from './dto/create-eligibility.dto.js';
import type { CreateWorkExperienceDto } from './dto/create-work-experience.dto.js';
import type { CreateTrainingDto } from './dto/create-training.dto.js';
import type { CreateSkillDto } from './dto/create-skill.dto.js';
import type { CreateDependentDto } from './dto/create-dependent.dto.js';

@Injectable()
export class PersonnelRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Education -----------------------------------------------------------
  findEducation(employeeId: string) {
    return this.prisma.employeeEducation.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' } });
  }

  createEducation(employeeId: string, dto: CreateEducationDto) {
    return this.prisma.employeeEducation.create({ data: { employeeId, ...dto } });
  }

  deleteEducation(employeeId: string, id: string) {
    return this.prisma.employeeEducation.delete({ where: { id, employeeId } });
  }

  // --- Eligibility -----------------------------------------------------------
  findEligibility(employeeId: string) {
    return this.prisma.employeeEligibility.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' } });
  }

  createEligibility(employeeId: string, dto: CreateEligibilityDto) {
    return this.prisma.employeeEligibility.create({ data: { employeeId, ...dto } });
  }

  deleteEligibility(employeeId: string, id: string) {
    return this.prisma.employeeEligibility.delete({ where: { id, employeeId } });
  }

  // --- Work experience -------------------------------------------------------
  findWorkExperience(employeeId: string) {
    return this.prisma.employeeWorkExperience.findMany({ where: { employeeId }, orderBy: { startDate: 'desc' } });
  }

  createWorkExperience(employeeId: string, dto: CreateWorkExperienceDto) {
    return this.prisma.employeeWorkExperience.create({ data: { employeeId, ...dto } });
  }

  deleteWorkExperience(employeeId: string, id: string) {
    return this.prisma.employeeWorkExperience.delete({ where: { id, employeeId } });
  }

  // --- Training ----------------------------------------------------------
  findTraining(employeeId: string) {
    return this.prisma.employeeTraining.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' } });
  }

  createTraining(employeeId: string, dto: CreateTrainingDto) {
    return this.prisma.employeeTraining.create({ data: { employeeId, ...dto } });
  }

  deleteTraining(employeeId: string, id: string) {
    return this.prisma.employeeTraining.delete({ where: { id, employeeId } });
  }

  // --- Skills ------------------------------------------------------------
  findSkills(employeeId: string) {
    return this.prisma.employeeSkill.findMany({ where: { employeeId }, orderBy: { createdAt: 'asc' } });
  }

  createSkill(employeeId: string, dto: CreateSkillDto) {
    return this.prisma.employeeSkill.create({ data: { employeeId, ...dto } });
  }

  deleteSkill(employeeId: string, id: string) {
    return this.prisma.employeeSkill.delete({ where: { id, employeeId } });
  }

  // --- Dependents (Family Background children grid) --------------------------
  findDependents(employeeId: string) {
    return this.prisma.dependent.findMany({ where: { employeeId }, orderBy: { createdAt: 'asc' } });
  }

  createDependent(employeeId: string, dto: CreateDependentDto) {
    return this.prisma.dependent.create({ data: { employeeId, ...dto } });
  }

  deleteDependent(employeeId: string, id: string) {
    return this.prisma.dependent.delete({ where: { id, employeeId } });
  }
}
