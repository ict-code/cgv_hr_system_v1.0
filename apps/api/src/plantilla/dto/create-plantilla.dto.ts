import { IsBoolean, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePlantillaDto {
  @IsString()
  itemNo!: string;

  @IsString()
  departmentId!: string;

  @IsOptional()
  @IsString()
  positionId?: string;

  @IsOptional()
  @IsString()
  oldItemNo?: string;

  @IsOptional()
  @IsInt()
  pageNo?: number;

  @IsOptional()
  @IsNumber()
  actualSalary?: number;

  @IsOptional()
  @IsNumber()
  authSalary?: number;

  @IsOptional()
  @IsInt()
  grade?: number;

  @IsOptional()
  @IsInt()
  step?: number;

  @IsOptional()
  @IsBoolean()
  partTime?: boolean;
}
