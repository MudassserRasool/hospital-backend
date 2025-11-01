import { PartialType } from '@nestjs/swagger';
import { CreateAppointmentDto } from './create-appointment.dto';
import { IsString, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class VitalsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  temperature?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  heartRate?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  weight?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  height?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  oxygenSaturation?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

class PrescriptionDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  medicineName: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  dosage: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  frequency: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  duration: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  instructions?: string;
}

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @ApiProperty({ required: false })
  @ValidateNested()
  @Type(() => VitalsDto)
  @IsOptional()
  vitals?: VitalsDto;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  checkupNotes?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @ApiProperty({ type: [PrescriptionDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionDto)
  @IsOptional()
  prescriptions?: PrescriptionDto[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  cancellationReason?: string;
}
