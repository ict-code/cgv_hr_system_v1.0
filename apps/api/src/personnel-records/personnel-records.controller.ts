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
}
