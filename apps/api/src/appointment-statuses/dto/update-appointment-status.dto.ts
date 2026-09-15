import { AppointmentStatusMode } from '@egaps/db';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateAppointmentStatusDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsEnum(AppointmentStatusMode)
  mode?: AppointmentStatusMode | null;
}
