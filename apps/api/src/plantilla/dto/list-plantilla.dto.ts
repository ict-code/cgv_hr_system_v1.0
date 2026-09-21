import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/dto/list-query.dto.js';

const SORT_OPTIONS = ['itemNo', 'employeeName', 'division', 'salary', 'grade'] as const;
export type PlantillaSort = (typeof SORT_OPTIONS)[number];

export class ListPlantillaDto extends ListQueryDto {
  @IsOptional()
  @IsString()
  departmentId?: string;

  // true = only items with no incumbent (employeeId is null).
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  vacant?: boolean;

  @IsOptional()
  @IsIn(SORT_OPTIONS)
  sort?: PlantillaSort;
}
