import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateEmployeeDto {
  @IsInt()
  empNo!: number;

  @IsString()
  lastName!: string;

  @IsString()
  firstName!: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsString()
  suffix?: string;

  @IsOptional()
  @IsString()
  sex?: string;

  @IsOptional()
  @IsString()
  civilStatus?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;
}
