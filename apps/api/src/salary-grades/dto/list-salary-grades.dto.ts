import { IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/dto/list-query.dto.js';

export class ListSalaryGradesDto extends ListQueryDto {
  @IsOptional()
  @IsString()
  salaryGradeTableId?: string;
}
