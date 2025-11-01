import { IsString, IsNotEmpty, IsOptional, IsDate, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], required: false })
  @IsEnum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
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
}
