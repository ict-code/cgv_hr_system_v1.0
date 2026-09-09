import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateDepartmentDto {
  @IsInt()
  deptCode!: number;

  @IsString()
  deptDesc!: string;

  @IsOptional()
  @IsString()
  shortDesc?: string;

  @IsOptional()
  @IsString()
  deptHead?: string;
}
