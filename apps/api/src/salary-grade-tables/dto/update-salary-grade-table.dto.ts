import { PartialType } from '@nestjs/mapped-types';
import { CreateSalaryGradeTableDto } from './create-salary-grade-table.dto.js';

export class UpdateSalaryGradeTableDto extends PartialType(CreateSalaryGradeTableDto) {}
