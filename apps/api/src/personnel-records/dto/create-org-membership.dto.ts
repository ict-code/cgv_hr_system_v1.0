import { IsString } from 'class-validator';

export class CreateOrgMembershipDto {
  @IsString()
  name!: string;
}
