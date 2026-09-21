import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateBrandingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MaxLength(200)
  subtitle!: string;
}
