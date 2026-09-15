import { PartialType } from '@nestjs/mapped-types';
import { CreateEligibilityDto } from './create-eligibility.dto.js';

export class UpdateEligibilityDto extends PartialType(CreateEligibilityDto) {}
