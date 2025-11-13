import { PartialType } from '@nestjs/swagger';
import { CreateHospitalDto } from './create-hospital.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateHospitalDto extends PartialType(CreateHospitalDto) {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
