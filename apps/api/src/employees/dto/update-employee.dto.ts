import { PartialType, OmitType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { CreateEmployeeDto } from './create-employee.dto.js';

// CreateEmployeeDto stays intentionally minimal (identity fields only, matching
// the legacy F6 Add flow) — the full Personal Data Sheet field set is only ever
// filled in afterwards via PATCH (the legacy F7 Edit flow), so those fields live
// here rather than being added to Create too.
export class UpdateEmployeeDto extends PartialType(OmitType(CreateEmployeeDto, ['empNo'] as const)) {
  @IsOptional()
  @IsString()
  fatherBirthPlace?: string;

  @IsOptional()
  @IsString()
  motherBirthPlace?: string;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  bloodType?: string;

  @IsOptional()
  @IsString()
  idNo?: string;

  @IsOptional()
  @IsString()
  biometricId?: string;

  @IsOptional()
  @IsString()
  pwdType?: string;

  @IsOptional()
  @IsString()
  religion?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  jobDescription?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  addrUnitNo?: string;

  @IsOptional()
  @IsString()
  addrStreet?: string;

  @IsOptional()
  @IsString()
  addrPhase?: string;

  @IsOptional()
  @IsString()
  addrBlockNo?: string;

  @IsOptional()
  @IsString()
  addrLot?: string;

  @IsOptional()
  @IsString()
  addrBarangay?: string;

  @IsOptional()
  @IsString()
  addrLocality?: string;

  @IsOptional()
  @IsString()
  addrProvince?: string;

  @IsOptional()
  @IsString()
  addrZip?: string;

  @IsOptional()
  @IsString()
  addrTelNo?: string;

  @IsOptional()
  @IsString()
  permanentAddress?: string;

  @IsOptional()
  @IsString()
  permanentTelNo?: string;

  @IsOptional()
  @IsString()
  permanentZipCode?: string;

  @IsOptional()
  @IsBoolean()
  validated?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  validatedDate?: Date;

  @IsOptional()
  @IsString()
  validatedBy?: string;

  @IsOptional()
  @IsString()
  divisionId?: string;

  @IsOptional()
  @IsString()
  salaryGradeTableId?: string;

  // Fields already on Employee that Create doesn't cover but Edit should.
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  birthDate?: Date;

  @IsOptional()
  @IsString()
  birthPlace?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  fatherName?: string;

  @IsOptional()
  @IsString()
  motherName?: string;

  @IsOptional()
  @IsString()
  spouseName?: string;

  @IsOptional()
  @IsString()
  spouseWork?: string;

  @IsOptional()
  @IsString()
  tin?: string;

  @IsOptional()
  @IsString()
  gsisNo?: string;

  @IsOptional()
  @IsString()
  pagibigNo?: string;

  @IsOptional()
  @IsString()
  philhealthNo?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  telNo?: string;

  @IsOptional()
  @IsString()
  cellNo?: string;

  @IsOptional()
  @IsString()
  emailAddress?: string;

  @IsOptional()
  @IsString()
  bankAccountNo?: string;

  @IsOptional()
  @IsString()
  taxStatus?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateHired?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  hiredDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  appointDate?: Date;

  @IsOptional()
  @IsBoolean()
  inactive?: boolean;

  @IsOptional()
  @IsString()
  inactiveCause?: string;
}
