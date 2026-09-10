import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateDependentDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsInt()
  age?: number;
}
