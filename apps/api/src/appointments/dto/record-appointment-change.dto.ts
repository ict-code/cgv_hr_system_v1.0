import { AppointType, PayMode, WorkLevel } from '@egaps/db';
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
  // Plain string, not an enum — see the AppointmentStatusCode model's doc
  // comment in schema.prisma for why (real data carries codes the legacy
  // system's own lookup table doesn't have).
  @IsString()
  status!: string;

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

  // Plain string, not an enum — real production data confirms this is a raw
  // EmployType.emp-status code (see Master Data > Employment Status File).
  @IsOptional()
  @IsString()
  employmentStatus?: string;

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

  // Contract period ("Period Covered" on the Casual/Contractual screens) —
  // legacy Appointment.Start-Date/End-Date. Optional since permanent/elected
  // appointments aren't time-bound.
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  /// Legacy Efficient-Rate: 1=Excellent .. 5=Unsatisfactory, captured on the
  /// change-log entry only (CHGAPP.P line 48-51) — not a field on Appointment itself.
  @IsOptional()
  @IsInt()
  efficiencyRate?: number;
}
