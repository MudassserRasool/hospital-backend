import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class AddressDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  country: string;
}

class ContactDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  website?: string;
}

class WorkingHoursDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  day: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  openTime: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  closeTime: string;
}

class LocationDto {
  @ApiProperty()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty()
  @IsNotEmpty()
  longitude: number;
}

class PaymentConfigDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  easyPaisaMerchantId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  easyPaisaStoreId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  accountDetails?: any;
}

export class CreateHospitalDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty()
  address: AddressDto;

  @ApiProperty({ type: ContactDto })
  @ValidateNested()
  @Type(() => ContactDto)
  @IsNotEmpty()
  contact: ContactDto;

  @ApiProperty({ type: [WorkingHoursDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursDto)
  @IsOptional()
  workingHours?: WorkingHoursDto[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  specialties?: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @ApiProperty({ type: PaymentConfigDto, required: false })
  @ValidateNested()
  @Type(() => PaymentConfigDto)
  @IsOptional()
  paymentConfig?: PaymentConfigDto;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  wifiSSID?: string;

  @ApiProperty({ type: LocationDto, required: false })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  facilities?: string[];

  // mobile package id
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  mobilePackageId: string;
}
