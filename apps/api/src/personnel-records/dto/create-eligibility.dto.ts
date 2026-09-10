import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateEligibilityDto {
  @IsString()
  examName!: string;

  @IsOptional()
  @IsDateString()
  examDate?: string;

  @IsOptional()
  @IsString()
  examPlace?: string;

  @IsOptional()
  @IsString()
  rating?: string;
}
