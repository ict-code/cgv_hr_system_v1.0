import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateServiceRecordDto } from './create-service-record.dto.js';

export class ImportServiceRecordsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateServiceRecordDto)
  records!: CreateServiceRecordDto[];
}
