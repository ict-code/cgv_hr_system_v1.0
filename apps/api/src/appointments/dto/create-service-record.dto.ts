import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateServiceRecordDto {
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsString()
  positionSnapshot?: string;

  @IsOptional()
  @IsString()
  departmentSnapshot?: string;

  @IsOptional()
  @IsString()
  divisionSnapshot?: string;

  // Plain string, not an enum — matches Appointment.employmentStatus and
  // Master Data > Employment Status File (real codes, not a fixed set).
  @IsOptional()
  @IsString()
  empStatusSnapshot?: string;

  @IsOptional()
  @IsNumber()
  salarySnapshot?: number;

  @IsOptional()
  @IsNumber()
  actlSalarySnapshot?: number;

  @IsOptional()
  @IsInt()
  grade?: number;

  @IsOptional()
  @IsInt()
  step?: number;

  @IsOptional()
  @IsString()
  itemNo?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  exitDate?: Date;

  @IsOptional()
  @IsString()
  exitCause?: string;

  @IsOptional()
  @IsString()
  leaveAbsence?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
