import { LearningDevelopmentType } from '@egaps/db';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateTrainingDto {
  @IsString()
  trainingName!: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsString()
  conductor?: string;

  @IsOptional()
  @IsString()
  periodCovered?: string;

  @IsOptional()
  @IsInt()
  numberOfHours?: number;

  @IsOptional()
  @IsEnum(LearningDevelopmentType)
  type?: LearningDevelopmentType;
}
