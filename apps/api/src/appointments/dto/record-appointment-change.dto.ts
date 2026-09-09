import {
  AppointmentStatus,
  AppointType,
  EmploymentStatus,
  PayMode,
  WorkLevel,
} from '@egaps/db';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class RecordAppointmentChangeDto {
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;

  @IsDate()
  @Type(() => Date)
  effectDate!: Date;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  positionId?: string;

  @IsOptional()
  @IsString()
  itemNo?: string;

  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus;

  @IsOptional()
  @IsEnum(AppointType)
  appointType?: AppointType;

  @IsOptional()
  @IsEnum(PayMode)
  payMode?: PayMode;

  @IsOptional()
  @IsEnum(WorkLevel)
  workLevel?: WorkLevel;

  @IsOptional()
  @IsNumber()
  actualSalary?: number;

  @IsOptional()
  @IsNumber()
  monthlyRate?: number;

  @IsOptional()
  @IsInt()
  grade?: number;

  @IsOptional()
  @IsInt()
  stepNo?: number;

  /// Legacy Efficient-Rate: 1=Excellent .. 5=Unsatisfactory, captured on the
  /// change-log entry only (CHGAPP.P line 48-51) — not a field on Appointment itself.
  @IsOptional()
  @IsInt()
  efficiencyRate?: number;
}
