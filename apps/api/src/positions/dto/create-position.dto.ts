import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreatePositionDto {
  @IsInt()
  positionCode!: number;

  @IsString()
  positionDesc!: string;

  @IsOptional()
  @IsString()
  shortDesc?: string;

  @IsOptional()
  @IsInt()
  positionGroup?: number;
}
