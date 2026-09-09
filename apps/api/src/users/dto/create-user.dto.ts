import { IsArray, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  loginId!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  fullName!: string;

  @IsArray()
  @IsString({ each: true })
  roleIds!: string[];
}
