import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWorkExperienceDto {
  @IsString()
  company!: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

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
