import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import ROLES from 'src/common/constants/roles.constant';
import { GENDER_TYPES_ARRAY } from 'src/common/constants';
import { BLOOD_TYPES } from 'src/common/constants/paitent';

class EmergencyContactDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsString()
  relation: string;
}

export class CreateProfileDto {
  @ApiProperty({ enum: ROLES })
  @IsEnum(ROLES)
  role: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: GENDER_TYPES_ARRAY })
  @IsEnum(GENDER_TYPES_ARRAY)
  @IsOptional()
  gender?: string;

  // Doctor/Staff fields
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  specialization?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  experience?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  timing?: string[];

  // Patient fields
  @ApiPropertyOptional({ enum: BLOOD_TYPES })
  @IsEnum(BLOOD_TYPES)
  @IsOptional()
  bloodType?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  allergies?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  chronicConditions?: string[];

  @ApiPropertyOptional({ type: EmergencyContactDto })
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  @IsOptional()
  emergencyContact?: EmergencyContactDto;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  medicalRecordNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  insuranceProvider?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  insurancePolicyNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  hospitalId?: string;
}

