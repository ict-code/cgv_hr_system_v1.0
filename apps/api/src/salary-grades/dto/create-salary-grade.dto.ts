import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsInt, IsNumber, IsString, ValidateNested } from 'class-validator';

export class SalaryStepDto {
  @IsNumber()
  amount!: number;

  @IsNumber()
  monthlyRate!: number;
}

export class CreateSalaryGradeDto {
  @IsString()
  salaryGradeTableId!: string;

  @IsInt()
  gradeNo!: number;

  // Positional — index 0 is step 1, index 9 is step 10.
  @ValidateNested({ each: true })
  @Type(() => SalaryStepDto)
  @ArrayMinSize(10)
  @ArrayMaxSize(10)
  steps!: SalaryStepDto[];
}
