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

  // true = only employees not currently the incumbent of any plantilla item.
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  withoutPlantilla?: boolean;

  // Comma-separated EmploymentStatusCode codes (e.g. "P,EL,CT") — filters to
  // employees whose current appointment's employmentStatus is one of these.
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').filter(Boolean) : value))
  @IsString({ each: true })
  employmentStatus?: string[];

  // Comma-separated codes — excludes employees whose CURRENT appointment's
  // employmentStatus is one of these (employees with no appointment stay in).
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').filter(Boolean) : value))
  @IsString({ each: true })
  notEmploymentStatus?: string[];
}
