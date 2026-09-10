import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateSalaryGradeTableDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
