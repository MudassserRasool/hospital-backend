import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { BLOOD_TYPES } from 'src/common/constants/paitent';

class EmergencyContactDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  relation: string;
}

export class CreatePatientDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dateOfBirth?: Date;

  @ApiProperty({ enum: ['male', 'female', 'other'], required: false })
  @IsEnum(['male', 'female', 'other'])
  @IsOptional()
  gender?: string;

  @ApiProperty({
    enum: BLOOD_TYPES,
    required: false,
  })
  @IsEnum(BLOOD_TYPES)
  @IsOptional()
  bloodType?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  allergies?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  chronicConditions?: string[];

  @ApiProperty({ type: EmergencyContactDto, required: false })
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  @IsOptional()
  emergencyContact?: EmergencyContactDto;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  medicalRecordNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  insuranceProvider?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  insurancePolicyNumber?: string;

  // hospital id
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  hospitalId?: string;

  // phone number
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
