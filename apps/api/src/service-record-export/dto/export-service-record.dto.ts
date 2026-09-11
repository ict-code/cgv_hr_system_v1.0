import { IsOptional, IsString } from 'class-validator';

export class ExportServiceRecordDto {
  @IsOptional()
  @IsString()
  certifiedDate?: string;

  @IsOptional()
  @IsString()
  signatoryName?: string;

  @IsOptional()
  @IsString()
  signatoryPosition?: string;
}
