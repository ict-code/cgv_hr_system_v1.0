import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class CreateEligibilityDto {
  @IsString()
  examName!: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  examDate?: Date;

  @IsOptional()
  @IsString()
  examPlace?: string;

  @IsOptional()
  @IsString()
  rating?: string;
}
