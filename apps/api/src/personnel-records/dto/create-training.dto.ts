import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateTrainingDto {
  @IsString()
  trainingName!: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  conductor?: string;

  @IsOptional()
  @IsString()
  periodCovered?: string;

  @IsOptional()
  @IsInt()
  numberOfHours?: number;
}
