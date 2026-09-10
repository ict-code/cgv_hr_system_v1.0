import { IsNumber } from 'class-validator';

export class UpdateSalaryStepDto {
  @IsNumber()
  amount!: number;
}
