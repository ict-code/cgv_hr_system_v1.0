import { PartialType } from '@nestjs/mapped-types';
import { CreateVoluntaryWorkDto } from './create-voluntary-work.dto.js';

export class UpdateVoluntaryWorkDto extends PartialType(CreateVoluntaryWorkDto) {}
