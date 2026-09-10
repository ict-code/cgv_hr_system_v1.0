import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWorkExperienceDto {
  @IsString()
  company!: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  salary?: number;

  @IsOptional()
  @IsString()
  salaryUnit?: string;

  @IsOptional()
  @IsString()
  employmentStatus?: string;
}
