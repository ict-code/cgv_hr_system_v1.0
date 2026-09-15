import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateEducationDto {
  @IsString()
  level!: string;

  @IsString()
  schoolName!: string;

  @IsOptional()
  @IsInt()
  attendanceFrom?: number;

  @IsOptional()
  @IsInt()
  attendanceTo?: number;

  @IsOptional()
  @IsInt()
  yearGraduated?: number;

  @IsOptional()
  @IsString()
  course?: string;

  @IsOptional()
  @IsString()
  degree?: string;

  @IsOptional()
  @IsString()
  honors?: string;
}
