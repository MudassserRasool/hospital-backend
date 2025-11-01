import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

class FeaturesDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  enableGoogleOAuth?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  enablePayments?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  enableNotifications?: boolean;
}

class LimitsDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  maxHospitals?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  maxStaffPerHospital?: number;
}

export class UpdateSettingsDto {
  @ApiProperty({ example: 'Hospital Management System', required: false })
  @IsString()
  @IsOptional()
  systemName?: string;

  @ApiProperty({ example: 'admin@hospital.com', required: false })
  @IsEmail()
  @IsOptional()
  systemEmail?: string;

  @ApiProperty({ type: FeaturesDto, required: false })
  @IsObject()
  @IsOptional()
  features?: FeaturesDto;

  @ApiProperty({ type: LimitsDto, required: false })
  @IsObject()
  @IsOptional()
  limits?: LimitsDto;
}
