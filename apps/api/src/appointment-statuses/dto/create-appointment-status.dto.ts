import { AppointmentStatusMode } from '@egaps/db';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentStatusDto {
  @IsString()
  code!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsEnum(AppointmentStatusMode)
  mode?: AppointmentStatusMode;
}
