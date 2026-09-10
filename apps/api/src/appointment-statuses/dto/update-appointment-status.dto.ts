import { IsBoolean, IsOptional, IsString } from 'class-validator';

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
}
