import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateGestTokenDto {
  @ApiProperty({
    description: 'Mobile package ID of the hospital',
    example: 'com.hospital.app',
  })
  @IsString()
  @IsNotEmpty()
  mobilePackageId: string;
}

