import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreatePlantillaDto } from './create-plantilla.dto.js';

export class UpdatePlantillaDto extends PartialType(OmitType(CreatePlantillaDto, ['itemNo'] as const)) {}
