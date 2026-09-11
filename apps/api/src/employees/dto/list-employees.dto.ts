import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/dto/list-query.dto.js';

export class ListEmployeesDto extends ListQueryDto {
  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  inactive?: boolean;
}
