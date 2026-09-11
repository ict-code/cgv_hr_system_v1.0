import { IsString } from 'class-validator';

export class CreateEmploymentStatusDto {
  @IsString()
  code!: string;

  @IsString()
  description!: string;
}
