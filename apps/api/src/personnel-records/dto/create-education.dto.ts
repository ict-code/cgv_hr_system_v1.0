import { IsOptional, IsString } from 'class-validator';

export class CreateEducationDto {
  @IsString()
  level!: string;

  @IsString()
  schoolName!: string;

  @IsOptional()
  @IsString()
  schoolYear?: string;

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
