import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, ValidateNested } from 'class-validator';
import { CreateServiceRecordDto } from '../../appointments/dto/create-service-record.dto.js';

export class ServiceRecordImportRowDto extends CreateServiceRecordDto {
  @IsInt()
  empNo!: number;
}

export class ImportAllServiceRecordsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ServiceRecordImportRowDto)
  records!: ServiceRecordImportRowDto[];
}
