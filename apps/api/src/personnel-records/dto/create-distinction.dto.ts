import { IsString } from 'class-validator';

export class CreateDistinctionDto {
  @IsString()
  name!: string;
}
