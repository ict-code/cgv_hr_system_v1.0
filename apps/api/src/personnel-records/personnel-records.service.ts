import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateEducationDto } from './dto/create-education.dto.js';
import type { CreateEligibilityDto } from './dto/create-eligibility.dto.js';
import type { CreateWorkExperienceDto } from './dto/create-work-experience.dto.js';
import type { CreateTrainingDto } from './dto/create-training.dto.js';
import type { CreateSkillDto } from './dto/create-skill.dto.js';
import type { CreateDependentDto } from './dto/create-dependent.dto.js';
import type { CreateVoluntaryWorkDto } from './dto/create-voluntary-work.dto.js';
import type { CreateDistinctionDto } from './dto/create-distinction.dto.js';
import type { CreateOrgMembershipDto } from './dto/create-org-membership.dto.js';
import type { UpdateEducationDto } from './dto/update-education.dto.js';
import type { UpdateEligibilityDto } from './dto/update-eligibility.dto.js';
import type { UpdateWorkExperienceDto } from './dto/update-work-experience.dto.js';
import type { UpdateTrainingDto } from './dto/update-training.dto.js';
import type { UpdateVoluntaryWorkDto } from './dto/update-voluntary-work.dto.js';

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

  updateEducation(employeeId: string, id: string, dto: UpdateEducationDto) {
    return this.prisma.employeeEducation.update({ where: { id, employeeId }, data: dto });
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

  updateEligibility(employeeId: string, id: string, dto: UpdateEligibilityDto) {
    return this.prisma.employeeEligibility.update({ where: { id, employeeId }, data: dto });
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

  updateWorkExperience(employeeId: string, id: string, dto: UpdateWorkExperienceDto) {
    return this.prisma.employeeWorkExperience.update({ where: { id, employeeId }, data: dto });
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

  updateTraining(employeeId: string, id: string, dto: UpdateTrainingDto) {
    return this.prisma.employeeTraining.update({ where: { id, employeeId }, data: dto });
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

  // --- Voluntary work ------------------------------------------------------
  findVoluntaryWork(employeeId: string) {
    return this.prisma.employeeVoluntaryWork.findMany({ where: { employeeId }, orderBy: { startDate: 'desc' } });
  }

  createVoluntaryWork(employeeId: string, dto: CreateVoluntaryWorkDto) {
    return this.prisma.employeeVoluntaryWork.create({ data: { employeeId, ...dto } });
  }

  updateVoluntaryWork(employeeId: string, id: string, dto: UpdateVoluntaryWorkDto) {
    return this.prisma.employeeVoluntaryWork.update({ where: { id, employeeId }, data: dto });
  }

  deleteVoluntaryWork(employeeId: string, id: string) {
    return this.prisma.employeeVoluntaryWork.delete({ where: { id, employeeId } });
  }

  // --- Non-academic distinctions --------------------------------------------
  findDistinctions(employeeId: string) {
    return this.prisma.employeeDistinction.findMany({ where: { employeeId }, orderBy: { createdAt: 'asc' } });
  }

  createDistinction(employeeId: string, dto: CreateDistinctionDto) {
    return this.prisma.employeeDistinction.create({ data: { employeeId, ...dto } });
  }

  deleteDistinction(employeeId: string, id: string) {
    return this.prisma.employeeDistinction.delete({ where: { id, employeeId } });
  }

  // --- Association/organization memberships ---------------------------------
  findOrgMemberships(employeeId: string) {
    return this.prisma.employeeOrgMembership.findMany({ where: { employeeId }, orderBy: { createdAt: 'asc' } });
  }

  createOrgMembership(employeeId: string, dto: CreateOrgMembershipDto) {
    return this.prisma.employeeOrgMembership.create({ data: { employeeId, ...dto } });
  }

  deleteOrgMembership(employeeId: string, id: string) {
    return this.prisma.employeeOrgMembership.delete({ where: { id, employeeId } });
  }
}
