import { PayMode, WorkLevel } from '@egaps/db';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

/** Place an EXISTING employee (already in the Personnel File) into a vacant plantilla item. */
export class AppointEmployeeDto {
  @IsString()
  employeeId!: string;

  // AppointmentStatusCode.code — must be an ENTRY-mode status.
  @IsString()
  status!: string;

  @IsDate()
  @Type(() => Date)
  effectDate!: Date;

  @IsOptional()
  @IsString()
  employmentStatus?: string;

  @IsOptional()
  @IsEnum(PayMode)
  payMode?: PayMode;

  @IsOptional()
  @IsEnum(WorkLevel)
  workLevel?: WorkLevel;

  // Defaults to the plantilla item's own actual rate when omitted.
  @IsOptional()
  @IsNumber()
  actualSalary?: number;

  @IsOptional()
  @IsNumber()
  monthlyRate?: number;
}
