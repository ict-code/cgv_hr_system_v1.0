import { IsString } from 'class-validator';

export class CreateAppointmentStatusDto {
  @IsString()
  code!: string;

  @IsString()
  description!: string;
}
