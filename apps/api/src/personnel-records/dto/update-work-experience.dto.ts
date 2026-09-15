import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkExperienceDto } from './create-work-experience.dto.js';

export class UpdateWorkExperienceDto extends PartialType(CreateWorkExperienceDto) {}
