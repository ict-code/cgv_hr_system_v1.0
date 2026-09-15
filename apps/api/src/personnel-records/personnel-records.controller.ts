import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { PersonnelRecordsService } from './personnel-records.service.js';
import { CreateEducationDto } from './dto/create-education.dto.js';
import { CreateEligibilityDto } from './dto/create-eligibility.dto.js';
import { CreateWorkExperienceDto } from './dto/create-work-experience.dto.js';
import { CreateTrainingDto } from './dto/create-training.dto.js';
import { CreateSkillDto } from './dto/create-skill.dto.js';
import { CreateDependentDto } from './dto/create-dependent.dto.js';
import { CreateVoluntaryWorkDto } from './dto/create-voluntary-work.dto.js';
import { CreateDistinctionDto } from './dto/create-distinction.dto.js';
import { CreateOrgMembershipDto } from './dto/create-org-membership.dto.js';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('employees/:employeeId')
export class PersonnelRecordsController {
  constructor(private readonly records: PersonnelRecordsService) {}

  // --- Education -----------------------------------------------------------
  @Get('education')
  findEducation(@Param('employeeId') employeeId: string) {
    return this.records.findEducation(employeeId);
  }

  @RequirePermissions('personnel:edit')
  @Post('education')
  createEducation(@Param('employeeId') employeeId: string, @Body() dto: CreateEducationDto) {
    return this.records.createEducation(employeeId, dto);
  }

  @RequirePermissions('personnel:edit')
  @Delete('education/:id')
  deleteEducation(@Param('employeeId') employeeId: string, @Param('id') id: string) {
    return this.records.deleteEducation(employeeId, id);
  }

  // --- Eligibility -----------------------------------------------------------
  @Get('eligibility')
  findEligibility(@Param('employeeId') employeeId: string) {
    return this.records.findEligibility(employeeId);
  }

  @RequirePermissions('personnel:edit')
  @Post('eligibility')
  createEligibility(@Param('employeeId') employeeId: string, @Body() dto: CreateEligibilityDto) {
    return this.records.createEligibility(employeeId, dto);
  }

  @RequirePermissions('personnel:edit')
  @Delete('eligibility/:id')
  deleteEligibility(@Param('employeeId') employeeId: string, @Param('id') id: string) {
    return this.records.deleteEligibility(employeeId, id);
  }

  // --- Work experience -------------------------------------------------------
  @Get('work-experience')
  findWorkExperience(@Param('employeeId') employeeId: string) {
    return this.records.findWorkExperience(employeeId);
  }

  @RequirePermissions('personnel:edit')
  @Post('work-experience')
  createWorkExperience(@Param('employeeId') employeeId: string, @Body() dto: CreateWorkExperienceDto) {
    return this.records.createWorkExperience(employeeId, dto);
  }

  @RequirePermissions('personnel:edit')
  @Delete('work-experience/:id')
  deleteWorkExperience(@Param('employeeId') employeeId: string, @Param('id') id: string) {
    return this.records.deleteWorkExperience(employeeId, id);
  }

  // --- Training ----------------------------------------------------------
  @Get('training')
  findTraining(@Param('employeeId') employeeId: string) {
    return this.records.findTraining(employeeId);
  }

  @RequirePermissions('personnel:edit')
  @Post('training')
  createTraining(@Param('employeeId') employeeId: string, @Body() dto: CreateTrainingDto) {
    return this.records.createTraining(employeeId, dto);
  }

  @RequirePermissions('personnel:edit')
  @Delete('training/:id')
  deleteTraining(@Param('employeeId') employeeId: string, @Param('id') id: string) {
    return this.records.deleteTraining(employeeId, id);
  }

  // --- Skills ------------------------------------------------------------
  @Get('skills')
  findSkills(@Param('employeeId') employeeId: string) {
    return this.records.findSkills(employeeId);
  }

  @RequirePermissions('personnel:edit')
  @Post('skills')
  createSkill(@Param('employeeId') employeeId: string, @Body() dto: CreateSkillDto) {
    return this.records.createSkill(employeeId, dto);
  }

  @RequirePermissions('personnel:edit')
  @Delete('skills/:id')
  deleteSkill(@Param('employeeId') employeeId: string, @Param('id') id: string) {
    return this.records.deleteSkill(employeeId, id);
  }

  // --- Dependents (Family Background children grid) --------------------------
  @Get('dependents')
  findDependents(@Param('employeeId') employeeId: string) {
    return this.records.findDependents(employeeId);
  }

  @RequirePermissions('personnel:edit')
  @Post('dependents')
  createDependent(@Param('employeeId') employeeId: string, @Body() dto: CreateDependentDto) {
    return this.records.createDependent(employeeId, dto);
  }

  @RequirePermissions('personnel:edit')
  @Delete('dependents/:id')
  deleteDependent(@Param('employeeId') employeeId: string, @Param('id') id: string) {
    return this.records.deleteDependent(employeeId, id);
  }

  // --- Voluntary work ------------------------------------------------------
  @Get('voluntary-work')
  findVoluntaryWork(@Param('employeeId') employeeId: string) {
    return this.records.findVoluntaryWork(employeeId);
  }

  @RequirePermissions('personnel:edit')
  @Post('voluntary-work')
  createVoluntaryWork(@Param('employeeId') employeeId: string, @Body() dto: CreateVoluntaryWorkDto) {
    return this.records.createVoluntaryWork(employeeId, dto);
  }

  @RequirePermissions('personnel:edit')
  @Delete('voluntary-work/:id')
  deleteVoluntaryWork(@Param('employeeId') employeeId: string, @Param('id') id: string) {
    return this.records.deleteVoluntaryWork(employeeId, id);
  }

  // --- Non-academic distinctions --------------------------------------------
  @Get('distinctions')
  findDistinctions(@Param('employeeId') employeeId: string) {
    return this.records.findDistinctions(employeeId);
  }

  @RequirePermissions('personnel:edit')
  @Post('distinctions')
  createDistinction(@Param('employeeId') employeeId: string, @Body() dto: CreateDistinctionDto) {
    return this.records.createDistinction(employeeId, dto);
  }

  @RequirePermissions('personnel:edit')
  @Delete('distinctions/:id')
  deleteDistinction(@Param('employeeId') employeeId: string, @Param('id') id: string) {
    return this.records.deleteDistinction(employeeId, id);
  }

  // --- Association/organization memberships ---------------------------------
  @Get('org-memberships')
  findOrgMemberships(@Param('employeeId') employeeId: string) {
    return this.records.findOrgMemberships(employeeId);
  }

  @RequirePermissions('personnel:edit')
  @Post('org-memberships')
  createOrgMembership(@Param('employeeId') employeeId: string, @Body() dto: CreateOrgMembershipDto) {
    return this.records.createOrgMembership(employeeId, dto);
  }

  @RequirePermissions('personnel:edit')
  @Delete('org-memberships/:id')
  deleteOrgMembership(@Param('employeeId') employeeId: string, @Param('id') id: string) {
    return this.records.deleteOrgMembership(employeeId, id);
  }
}
