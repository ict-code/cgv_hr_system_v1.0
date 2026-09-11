import { IsOptional, IsString } from 'class-validator';

export class UpdateEmploymentStatusDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
