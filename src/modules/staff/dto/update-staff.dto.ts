import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';
import { UpdateProfileDto } from '../../profiles/dto/update-profile.dto';

/**
 * DTO for updating staff profile
 * Combines user fields (from users collection) and profile fields (from profiles collection)
 */
export class UpdateStaffDto {
  // User fields (stored in users collection)
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  profilePicture?: string;

  // Profile fields (stored in profiles collection)
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  gender?: string;

  // Staff/Doctor-specific fields
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
  @IsOptional()
  timing?: string[];
}
