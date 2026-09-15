import { PartialType } from '@nestjs/mapped-types';
import { CreateTrainingDto } from './create-training.dto.js';

export class UpdateTrainingDto extends PartialType(CreateTrainingDto) {}
